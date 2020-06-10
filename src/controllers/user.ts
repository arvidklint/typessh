import { AuthContext } from 'ssh2';

const MAX_USERNAME_LENGTH = 10;
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 1;
const MAX_PASSWORD_LENGTH = 256;

const ENTER_USERNAME_PROMPT = 'Enter username: ';
const ENTER_PASSWORD_PROMPT = 'Enter password: ';

type ValidationResult = {
    valid: boolean;
    reason: string;
};
const validateUsername = (name: string): ValidationResult => {
    if (name.length < MIN_USERNAME_LENGTH) {
        return {
            valid: false,
            reason: `Username needs to be minimum ${MIN_USERNAME_LENGTH} characters`,
        };
    }
    if (name.length > MAX_USERNAME_LENGTH) {
        return {
            valid: false,
            reason: `Username needs to be maximum ${MAX_USERNAME_LENGTH} characters`,
        };
    }
    // if (this.clients.some((client) => client.id === name)) {
    //     return {
    //         valid: false,
    //         reason: `That username is already in use\n${ENTER_USERNAME_PROMPTS}`,
    //     };
    // }

    return {
        valid: true,
        reason: 'Username is valid!',
    };
};

const validatePassword = (password: string): ValidationResult => {
    if (password.length === 0) {
        return {
            valid: false,
            reason: `Password needs to be minimum ${MIN_PASSWORD_LENGTH} characters`,
        };
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return {
            valid: false,
            reason: `Password needs to be maximum ${MAX_PASSWORD_LENGTH} characters`,
        };
    }
    return {
        valid: true,
        reason: 'Password is valid!',
    };
};

function getUsername(ctx: AuthContext) {
    return new Promise<string>((resolve) => {
        const promptForUsername = (answers: string[]) => {
            const validation = validateUsername(answers[0]);
            if (!validation.valid) {
                return ctx.prompt(
                    `${validation.reason}\n${ENTER_USERNAME_PROMPT}`,
                    promptForUsername
                );
            }
            return resolve(answers[0]);
        };
        ctx.prompt(ENTER_USERNAME_PROMPT, promptForUsername);
    });
}

function doLogin(username: string, ctx: AuthContext) {
    return new Promise<boolean>((resolve, reject) => {
        const promptForPassword = (answers: string[]) => {
            const password = answers[0];
            // TODO Check password against database
            if (password === 'test') {
                return resolve(true);
            }
            return reject('Password does not match');
        };
        ctx.prompt(ENTER_PASSWORD_PROMPT, promptForPassword);
    });
}

export async function login(ctx: AuthContext) {
    const username = await getUsername(ctx);
    try {
        const success = await doLogin(username, ctx);
        return success;
    } catch (e) {
        return false;
    }
}
