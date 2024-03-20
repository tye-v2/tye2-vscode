// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function reviewIssues(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://github.com/tye-v2/tye2-vscode/issues');
}

const createReviewIssuesCommand = (ui: UserInput) => (): Thenable<boolean> => reviewIssues(ui);

export default createReviewIssuesCommand;
