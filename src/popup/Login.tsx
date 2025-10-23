import { Group, Stack, ActionIcon, Popover, Text } from "@mantine/core";
import { User, Key, LogIn } from "react-feather";
import Logins, { TinyLogin } from "../common/logins";
import { useMemo, useState } from "react";
import useMonostable from "../common/useMonostable";

export interface LoginProps {
    login: TinyLogin
}

function normalizeText(str: string, len: number) {
    if (str.length > len) {
        const partLen = len / 2 - 2;

        return str.substring(0, partLen) + "..." + str.substring(str.length - partLen, str.length);
    }

    return str;
}

export default function Login({login}: LoginProps) {
    const normalized = useMemo(() => {
        return {
            name: normalizeText(login.name, 50),
            description: login.url ? `${normalizeText(login.url, 50)} - ${login.login}` : login.login
        }
    }, [login]);

    const [showError, setShowError] = useMonostable(1000);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    return <Group wrap="nowrap">
        <Stack>
            <Text>{normalized.name}</Text>
            <Text opacity={0.7} size="xs">{normalized.description}</Text>
        </Stack>
        <Popover opened={showError}>
            <Popover.Target>
                <Group wrap="nowrap">
                    <ActionIcon title="copy username" loading={loading} onClick={() => navigator.clipboard.writeText(login.login)}>
                        <User />
                    </ActionIcon>
                    <ActionIcon title="copy password" loading={loading} onClick={async () => {
                        setLoading(true);
                        try {
                            const detail = await Logins.detail(login.id);

                            navigator.clipboard.writeText(detail.password);
                        } catch (e) {
                            setError("" + e);
                            setShowError();
                        }
                        setLoading(false);
                    }}>
                        <Key />
                    </ActionIcon>
                    <ActionIcon title="fill login form" loading={loading} onClick={async () => {
                        setLoading(true);
                        try {
                            await Logins.fill(login);
                        } catch (e) {
                            setError("" + e);
                            setShowError();
                        }
                        setLoading(false);
                    }}>
                        <LogIn />
                    </ActionIcon>
                </Group>
            </Popover.Target>
            <Popover.Dropdown>
                <Text c="red">{error || "Something went wrong. Please try again."}</Text>
            </Popover.Dropdown>
        </Popover>
    </Group>
}