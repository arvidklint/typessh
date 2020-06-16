import bcrypt from 'bcrypt';
import { AuthContext } from 'ssh2';
import User, { IUser } from '../db/models/User';
import log from '../log';

type ValidationResult = {
    valid: boolean;
    reason: string;
};

const MAX_USERNAME_LENGTH = 10;
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 1;
const MAX_PASSWORD_LENGTH = 256;

const ENTER_USERNAME_PROMPT =
    'Enter existing username or the one you want to create\n - ';
const ENTER_PASSWORD_PROMPT = 'Enter password ';
const ENTER_NEW_PASSWORD_PROMPT = 'Enter new password ';

const PASSWORD_ATTEMPTS = 3;

function prompt(text: string, ctx: AuthContext, echo: boolean = true) {
    return new Promise<string[]>((resolve) => {
        // @ts-ignore
        ctx.prompt({ prompt: text, echo }, (answers: string[]) => {
            resolve(answers);
        });
    });
}

function validateUsername(name: string): ValidationResult {
    if (!name) {
        return {
            valid: false,
            reason: 'No username',
        };
    }
    if (name.length < MIN_USERNAME_LENGTH) {
        return {
            valid: false,
            reason: `Username needs to be minimum ${MIN_USERNAME_LENGTH} characters.`,
        };
    }
    if (name.length > MAX_USERNAME_LENGTH) {
        return {
            valid: false,
            reason: `Username needs to be maximum ${MAX_USERNAME_LENGTH} characters.`,
        };
    }
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return {
            valid: false,
            reason: 'invalid username! Valid characters are a-z, A-Z, 0-9.',
        };
    }

    return {
        valid: true,
        reason: 'Username is valid!',
    };
}

function validatePassword(password: string): ValidationResult {
    if (!password) {
        return {
            valid: false,
            reason: 'No password',
        };
    }
    if (password.length === 0) {
        return {
            valid: false,
            reason: `Password needs to be minimum ${MIN_PASSWORD_LENGTH} characters.`,
        };
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return {
            valid: false,
            reason: `Password needs to be maximum ${MAX_PASSWORD_LENGTH} characters.`,
        };
    }
    return {
        valid: true,
        reason: 'Password is valid!',
    };
}

async function getUsername(ctx: AuthContext): Promise<string> {
    try {
        const promptForUsername = async (answers: string[]) => {
            const username = answers[0];
            const validation = validateUsername(username);
            if (!validation.valid) {
                const answers = await prompt(
                    `${validation.reason}\n${ENTER_USERNAME_PROMPT}`,
                    ctx
                );
                return promptForUsername(answers);
            }
            return answers[0];
        };

        const answers = await prompt(
            `Welcome to TypiSSHt!\n${ENTER_USERNAME_PROMPT}`,
            ctx
        );
        return await promptForUsername(answers);
    } catch (e) {
        log.error(e);
        throw e;
    }
}

async function createUser(ctx: AuthContext, username: string): Promise<IUser> {
    try {
        const promptForNewPassword = async (answers: string[]) => {
            const password = answers[0];
            const validation = validatePassword(password);
            if (!validation.valid) {
                const answers = await prompt(
                    `${validation.reason}\n${ENTER_NEW_PASSWORD_PROMPT}`,
                    ctx,
                    false
                );
                return promptForNewPassword(answers);
            }
            return password;
        };

        const answers = await prompt(
            `${ENTER_NEW_PASSWORD_PROMPT}`,
            ctx,
            false
        );
        const password = await promptForNewPassword(answers);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            username,
            password: hashedPassword,
        });
        const user = await newUser.save();
        return user;
    } catch (e) {
        log.error(e);
        throw e;
    }
}

async function checkPassword(ctx: AuthContext, user: IUser): Promise<boolean> {
    try {
        const checkAndPrompt = async (
            answers: string[],
            attemptsLeft: number
        ): Promise<boolean> => {
            if (attemptsLeft <= 0) {
                return false;
            }
            const password = answers[0];
            const check = await bcrypt.compare(password, user.password);
            if (check) {
                return true;
            }
            const newAnswers = await prompt(
                `Incorrect password (attempts left: ${attemptsLeft})\n${ENTER_PASSWORD_PROMPT}`,
                ctx,
                false
            );
            return checkAndPrompt(newAnswers, attemptsLeft - 1);
        };

        const answers = await prompt(`${ENTER_PASSWORD_PROMPT}`, ctx, false);
        const check = await checkAndPrompt(answers, PASSWORD_ATTEMPTS - 1);
        return check;
    } catch (e) {
        log.error(e);
        throw e;
    }
}

/*
 * Handle login and creation of user
 *
 * 1. get username
 * 2. check if username exists
 *   - no: ask to create
 *     - yes: ask for password and create user
 *     - no: return false
 *   - yes: ask for password
 * 3. return user
 */
export async function handleLogin(ctx: AuthContext): Promise<IUser> {
    try {
        const username = await getUsername(ctx);

        const user = await User.findOne({ username });
        if (!user) {
            const answers = await prompt(
                `Username does not exist. Do you want to create it? (y/N): `,
                ctx
            );
            const answer = answers[0];
            if (answer === 'y' || answer === 'Y') {
                return await createUser(ctx, username);
            }
            return null;
        }

        const check = await checkPassword(ctx, user);
        if (check) return user;
        return null;
    } catch (e) {
        log.error(e);
    }
}
