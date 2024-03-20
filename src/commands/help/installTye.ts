// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { UserInput } from '../../services/userInput';

export function installTye(ui: UserInput): Thenable<boolean> {
    return ui.openExternal('https://www.tye2.org/getting-started.html');
}

const createInstallTyeCommand = (ui: UserInput) => (): Thenable<boolean> => installTye(ui);

export default createInstallTyeCommand;
