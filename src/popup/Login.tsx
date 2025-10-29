import { Group, Stack, ActionIcon, Popover, Text } from "@mantine/core";
import { User, Key, LogIn } from "react-feather";
import Logins, { TinyLogin } from "../common/logins";
import { useMemo, useState } from "react";
import useMonostable from "../common/useMonostable";
import FeedbackAction from "./FeedbackAction";
import Browser from "webextension-polyfill";

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
            name: normalizeText(login.name, 30),
            url: login.url ? <a
                    title={login.url}
                    href={login.url}
                    onClick={(e) => {
                        e.preventDefault();
                        Browser.tabs.create({url: login.url})
                    }}
                >
                    {normalizeText(login.url, 30)}
                </a> : null,
            user: login.login
        }
    }, [login]);

    const [showError, setShowError] = useMonostable(1000);
    const [error, setError] = useState("");

    return <Group wrap="nowrap" justify="space-between">
        <Stack gap={0} style={{textWrap: "nowrap"}}>
            <Text>{normalized.name}</Text>
            <Group gap={0} opacity={0.7}>
                {normalized.url && <>
                    <Text size="xs">{normalized.url}</Text>
                    <Text size="xs">&nbsp;-&nbsp;</Text>
                </>}
                <Text size="xs">{normalized.user}</Text>
            </Group>
        </Stack>
        <Popover opened={showError}>
            <Popover.Target>
                <ActionIcon.Group>
                    <FeedbackAction size="lg" variant="light" title="copy username" onClick={() => navigator.clipboard.writeText(login.login)}>
                        <User />
                    </FeedbackAction>
                    <FeedbackAction size="lg" variant="light" title="copy password" onClick={async () => {
                        try {
                            const detail = await Logins.detail(login.id);

                            navigator.clipboard.writeText(detail.password);
                        } catch (e) {
                            setError("" + e);
                            setShowError();
                        }
                    }}>
                        <Key />
                    </FeedbackAction>
                    <FeedbackAction size="lg" variant="light" title="fill login form" onClick={async () => {
                        try {
                            await Logins.fill(login);
                        } catch (e) {
                            setError("" + e);
                            setShowError();
                        }
                    }}>
                        <LogIn />
                    </FeedbackAction>
                </ActionIcon.Group>
            </Popover.Target>
            <Popover.Dropdown>
                <Text c="red">{error || "Something went wrong. Please try again."}</Text>
            </Popover.Dropdown>
        </Popover>
    </Group>
}