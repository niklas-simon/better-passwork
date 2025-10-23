import { ScrollArea, Stack, Text } from "@mantine/core";
import { TinyLogin } from "../common/logins";
import Suspender from "../common/suspender";
import Login from "./Login";

export interface LoginListProps {
    logins: Suspender<TinyLogin[], string>,
    emptyText?: string
}

export default function LoginList({logins, emptyText}: LoginListProps) {
    const isError = logins.isError();

    if (isError) {
        return <Text c="red">{logins.err()}</Text>
    }

    const res = logins.read();

    if (!res.length) {
        return <Text>{emptyText || "(empty list)"}</Text>
    }

    return <ScrollArea flex={1} mah="300px" variant="native">
        <Stack>
            {res.map((login, i) => <Login key={i} login={login} />)}
        </Stack>
    </ScrollArea>
}