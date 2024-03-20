// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function readDocumentation(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://www.tye2.org/getting-started.html');
}

const createReadDocumentationCommand = (ui: UserInput) => (): Thenable<boolean> => readDocumentation(ui);

export default createReadDocumentationCommand;
