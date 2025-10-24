import { ScrollArea, Stack, Text } from "@mantine/core";
import { TinyLogin } from "../common/logins";
import Suspender from "../common/suspender";
import Login from "./Login";

export interface LoginListProps {
    logins: Suspender<TinyLogin[], string>,
    emptyText?: string,
    flex?: number
}

export default function LoginList({logins, emptyText, flex}: LoginListProps) {
    const isError = logins.isError();

    if (isError) {
        return <Text c="red">{`${logins.err()}`}</Text>
    }

    const res = logins.read();

    if (!res.length) {
        return <Text>{emptyText || "(empty list)"}</Text>
    }

    return <ScrollArea flex={flex} mih={0} scrollbarSize={2}>
        <Stack>
            {res.slice(0, 20).map((login, i) => <Login key={i} login={login} />)}
            {res.length > 20 && <Text>{`(+${res.length - 20} more`}</Text>}
        </Stack>
    </ScrollArea>
}