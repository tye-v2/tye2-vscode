// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function getStarted(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://www.tye2.org/getting-started.html');
}

const createGetStartedCommand = (ui: UserInput) => (): Thenable<boolean> => getStarted(ui);

export default createGetStartedCommand;
