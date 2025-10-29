import { ScrollArea, Stack, Text } from "@mantine/core";
import { TinyLogin } from "../common/logins";
import Suspender from "../common/suspender";
import Login from "./Login";
import { useMemo } from "react";

export interface LoginListProps {
    logins: Suspender<TinyLogin[], string>,
    emptyText?: string,
    flex?: number,
    mah?: number | string
}

export default function LoginList({logins, emptyText, flex, mah}: LoginListProps) {
    const isError = logins.isError();
    const errText = useMemo(() => {
        if (isError) {
            return logins.err();
        } else {
            return null;
        }
    }, [logins, isError])

    if (errText) {
        return <Text c="red" title={errText.length > 50 ? errText : undefined}>{`${errText.length > 50 ? errText.substring(0, 50) + "..." : errText}`}</Text>
    }

    const res = logins.read();

    if (!res.length) {
        return <Text>{emptyText || "(empty list)"}</Text>
    }

    return <ScrollArea flex={flex} mih={0} mah={mah} scrollbarSize={2}>
        <Stack>
            {res.slice(0, 20).map((login, i) => <Login key={i} login={login} />)}
            {res.length > 20 && <Text>{`(+${res.length - 20} more`}</Text>}
        </Stack>
    </ScrollArea>
}