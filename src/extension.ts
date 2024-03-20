// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from 'vscode';
import AxiosHttpClient from './services/httpClient';
import { httpTyeClientProvider } from './services/tyeClient';
import { TyeLogDocumentContentProvider } from './documents/tyeLogDocumentContentProvider';
import TyeRunCommandTaskProvider from './tasks/tyeRunTaskProvider';
import { TyeDebugConfigurationProvider } from './debug/tyeDebugConfigurationProvider';
import { KnownServiceType, TaskBasedTyeApplicationProvider } from './services/tyeApplicationProvider';
import { TyeApplicationDebugSessionWatcher } from './debug/tyeApplicationWatcher';
import { CoreClrDebugSessionMonitor } from './debug/debugSessionMonitor';
import { attachToReplica } from './debug/attachToReplica';
import { createAzExtOutputChannel, registerUIExtensionVariables, IActionContext } from '@microsoft/vscode-azext-utils';
import ext from './ext';
import AzureTelemetryProvider from './services/telemetryProvider';
import createScaffoldTyeTasksCommand from './commands/scaffolding/scaffoldTyeTasks';
import LocalScaffolder from './scaffolding/scaffolder';
import { AggregateUserInput } from './services/userInput';
import { WorkspaceTyeApplicationConfigurationProvider, YamlTyeApplicationConfigurationReader } from './services/tyeApplicationConfiguration';
import createInitializeTyeCommand from './commands/scaffolding/initializeTye';
import LocalTyeCliClient from './services/tyeCliClient';
import HelpTreeDataProvider from './views/help/helpTreeDataProvider';
import createReadDocumentationCommand from './commands/help/readDocumentation';
import createGetStartedCommand from './commands/help/getStarted';
import createReportIssueCommand from './commands/help/reportIssue';
import createReviewIssuesCommand from './commands/help/reviewIssues';
import { TyeServicesTreeDataProvider } from './views/services/tyeServicesTreeDataProvider';
import TyeReplicaNode, { isAttachable } from './views/services/tyeReplicaNode';
import TyeServiceNode from './views/services/tyeServiceNode';
import VsCodeSettingsProvider from './services/settingsProvider';
import LocalTyePathProvider from './services/tyePathProvider';
import createBrowseServiceCommand from './commands/browseService';
import TreeNode from './views/treeNode';
import LocalTyeInstallationManager from './services/tyeInstallationManager';
import createInstallTyeCommand from './commands/help/installTye';
import LocalTyeProcessProvider from './services/tyeProcessProvider';
import createPlatformProcessProvider from './services/processProvider';
import LocalPortProvider from './services/portProvider';
import createShutdownApplicationCommand from './commands/shutdownApplication';
import TyeApplicationNode from './views/services/tyeApplicationNode';

interface ExtensionPackage {
	engines: { [key: string]: string };
}

export function activate(context: vscode.ExtensionContext): Promise<void> {
	function registerDisposable<T extends vscode.Disposable>(disposable: T): T {
		context.subscriptions.push(disposable);
		
		return disposable;
	}

	ext.context = context;
	ext.ignoreBundle = true;
	ext.outputChannel = registerDisposable(createAzExtOutputChannel('Tye2', 'tye2'));

	registerUIExtensionVariables(ext);

	const telemetryProvider = new AzureTelemetryProvider();

	return telemetryProvider.callWithTelemetry(
		'tye2-vscode.extension.activate',
		(actionContext: IActionContext) => {
			actionContext.telemetry.properties.isActivationEvent = 'true';

			const httpClient = new AxiosHttpClient();

			const tyeClientProvider = httpTyeClientProvider(httpClient);
			const settingsProvider = new VsCodeSettingsProvider();
			const tyePathProvider = new LocalTyePathProvider(settingsProvider);
			const tyeProcessProvider = new LocalTyeProcessProvider(new LocalPortProvider(), createPlatformProcessProvider(), tyeClientProvider, tyePathProvider);
			const tyeApplicationProvider = new TaskBasedTyeApplicationProvider(tyeProcessProvider, tyeClientProvider);

			registerDisposable(vscode.workspace.registerTextDocumentContentProvider('tye2-log', registerDisposable(new TyeLogDocumentContentProvider(tyeApplicationProvider, tyeClientProvider))));
		
			const extensionPackage = <ExtensionPackage>context.extension.packageJSON;
			const tyeCliClient = new LocalTyeCliClient(() => tyePathProvider.getTyePath());
			const ui = new AggregateUserInput(actionContext.ui);
			const tyeInstallationManager = new LocalTyeInstallationManager(extensionPackage.engines['tye2'], tyeCliClient, ui);

			const treeProvider = new TyeServicesTreeDataProvider(tyeApplicationProvider, tyeClientProvider, tyeInstallationManager, ui);

			registerDisposable(vscode.window.registerTreeDataProvider(
				'tye2-vscode.views.services',
				treeProvider
			));

			registerDisposable(
				vscode.window.registerTreeDataProvider(
					'tye2-vscode.views.help',
					new HelpTreeDataProvider()));

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.refreshEntry',
				() => {
					treeProvider.refresh();
				});

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.browseService',
				createBrowseServiceCommand(ui));

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.launchTyeDashboard',
				async (context, node: TyeApplicationNode) => {
					if (node.application.dashboard?.scheme === 'http' || node.application.dashboard?.scheme === 'https') {
						await vscode.env.openExternal(node.application.dashboard);
					}
				});

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.shutdownApplication',
				createShutdownApplicationCommand(tyeClientProvider, ui));
	
			const debugSessionMonitor = registerDisposable(new CoreClrDebugSessionMonitor());

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.attachService',
				async (context, node: TreeNode) => await registerAttachCommand(node, debugSessionMonitor));

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.attachReplica',
				async (context, node: TreeNode) => await registerAttachCommand(node, debugSessionMonitor));

			const scaffolder = new LocalScaffolder();
			const tyeApplicationConfigurationProvider = new WorkspaceTyeApplicationConfigurationProvider(new YamlTyeApplicationConfigurationReader());

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.scaffolding.initTye2',
				createInitializeTyeCommand(tyeApplicationConfigurationProvider, tyeCliClient, tyeInstallationManager, ui));

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.scaffolding.scaffoldTye2Tasks',
				createScaffoldTyeTasksCommand(tyeApplicationConfigurationProvider, scaffolder, ui));

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.showLogs',
				async (context, node: TyeServiceNode) => {
					const logUri = vscode.Uri.parse(`tye2-log://logs/${node.application.id}/${node.service.description.name}`);
							
					const doc = await vscode.workspace.openTextDocument(logUri);

					await vscode.window.showTextDocument(doc);
				});

			telemetryProvider.registerCommandWithTelemetry(
				'tye2-vscode.commands.debugAll',
				async (context, node: TyeApplicationNode) => {
					const application = node.application;

					if (application?.projectServices) {
						for (const service of Object.values(application.projectServices)) {
								for (const replicaName of Object.keys(service.replicas)) {
									const pid = service.replicas[replicaName];

									await attachToReplica(debugSessionMonitor, undefined, service.serviceType, replicaName, pid);
								}
						}
					}
				});
		
			telemetryProvider.registerCommandWithTelemetry('tye2-vscode.commands.help.getStarted', createGetStartedCommand(ui));
			telemetryProvider.registerCommandWithTelemetry('tye2-vscode.commands.help.installTye2', createInstallTyeCommand(ui));
			telemetryProvider.registerCommandWithTelemetry('tye2-vscode.commands.help.readDocumentation', createReadDocumentationCommand(ui));
			telemetryProvider.registerCommandWithTelemetry('tye2-vscode.commands.help.reportIssue', createReportIssueCommand(ui));
			telemetryProvider.registerCommandWithTelemetry('tye2-vscode.commands.help.reviewIssues', createReviewIssuesCommand(ui));
	
			const applicationWatcher = registerDisposable(new TyeApplicationDebugSessionWatcher(debugSessionMonitor, tyeApplicationProvider));
		
			registerDisposable(vscode.debug.registerDebugConfigurationProvider('tye2', new TyeDebugConfigurationProvider(debugSessionMonitor, tyeApplicationProvider, applicationWatcher, ui)));
		
			registerDisposable(vscode.tasks.registerTaskProvider('tye2-run', new TyeRunCommandTaskProvider(telemetryProvider, tyeApplicationProvider, tyeClientProvider, tyeInstallationManager, tyePathProvider)));

			return Promise.resolve();
		});

		async function registerAttachCommand(node: TreeNode, debugSessionMonitor: CoreClrDebugSessionMonitor)
		{
			const replicas: { replica: TyeReplica, serviceType: KnownServiceType }[] = [];

			if (node instanceof TyeServiceNode && isAttachable(node.service)) {
				replicas.push(...Object.values(node.service.replicas).map(replica => ({ replica: replica, serviceType: <KnownServiceType>node.service.serviceType })));
			} else if (node instanceof TyeReplicaNode && isAttachable(node.service)) {
				replicas.push({ replica: node.replica, serviceType: <KnownServiceType>node.service.serviceType });
			}

			for (const replica of replicas) {
				await attachToReplica(debugSessionMonitor, undefined, replica.serviceType, replica.replica.name, replica.replica.pid);
			}
		}
}
