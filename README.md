# Tye2 for Visual Studio Code (Preview)

The Tye2 extension makes it easier to run and debug applications that are using [Tye2](https://github.com/tye-v2/tye2)

## Prerequisites

### Docker

Using Tye2 requires Docker to be installed.\
[Install Docker](https://docs.docker.com/get-docker/) on your machine and add it to the system path.

### Tye2

Using the Tye2 tooling requires a project to be run using the Tye2 CLI.\
Instructions for installing Tye2 CLI can be found [here](https://www.tye2.org/getting-started.html).

### Visual Studio Code
[Download](https://code.visualstudio.com/Download) and install Visual Studio Code on your machine.

## Feature Overview
The Tye2 extension lets you view and debug Tye2 services.

### View running Tye2 application
You can view the running Tye2 application, view all services and it's replicas, view logs and open the services in the browser.

[![View running Tye2 application](https://aka.ms/tye-dashboard-t)](https://aka.ms/tye-dashboard-v)

### Generating Tye2 assets
You can add `tye.yaml` file to your workspace by opening the Command Palette (<kbd>F1</kbd>) and using **Tye: Initialize Tye** command. The command will generate `tye.yaml` based on .NET projects in the solution currently open in the workspace.

### Generating task and launch configuration
You can add the task **tye2-run** to run the Tye2 application and a debug launch configuration **Debug with Tye2** to debug the Tye2 application by opening the Command Palette (<kbd>F1</kbd>) and using the **Tye: Scaffold Tye2 Tasks** command.

[![Generating tasks and launch configuration](https://aka.ms/tye-scaffold-t)](https://aka.ms/tye-scaffold-v)

### Running and debugging the Tye2 application
The extension offers command to run the Tye2 application, attach the debugger to already running service or start the Tye2 application with debugger attached to all debuggable services.

#### Run the Tye2 application
You can run the Tye2 application by running the task **tye2-run**.

![Run the Tye2 application](resources/readme/tye-run.gif)

#### Debug an already running service
You can attach the debugger to an already running service by clicking on the **Attach** icon on any replica of the service you want to debug.

[![Debug an already running service](https://aka.ms/tye-debug-attach-t)](https://aka.ms/tye-debug-attach-v)

#### Debug with Tye2
The **Debug with Tye2** launch configuration helps you debug multiple services at a time.
The default scaffolded configuration attaches the debugger to all debuggable services, but it can be configured to attach to only a subset of services.

[![Debug all services](https://aka.ms/tye-debug-all-t)](https://aka.ms/tye-debug-all-v)

##### Configuring a subset of services to debug
Services to debug can be configured by adding `services` property in the **Debug with Tye2** launch configuration.

![Configuring subset of services for debugging](resources/readme/debug-subset.png)

##### Enabling the `watch` mode for debugging
The Tye2 extension lets you start the Tye2 application in the `watch` mode and subsequently attach the debugger in the `watch` mode. With the `watch` mode on, the debugger watches for any code changes and re-attaches to the re-spawned services.

[![Debug services in watch mode](https://aka.ms/tye-watch-t)](https://aka.ms/tye-watch-v)

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.

## Reporting security issues and bugs

The Tye2 extension is an experimental project, and as such we expect all users to take responsibility for evaluating the security of their own applications.

## License

[MIT](LICENSE)
