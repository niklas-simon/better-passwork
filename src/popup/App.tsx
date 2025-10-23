import "@mantine/core/styles.css";
import { ActionIcon, Divider, Group, Loader, MantineProvider, Stack, Title } from "@mantine/core";
import { theme } from "../common/theme";
import { Settings } from "react-feather";
import Logins from "../common/logins";
import Suspender from "../common/suspender";
import LoginList from "./LoginList";
import Search from "./Search";
import { Suspense } from "react";

export default function App() {
    const currentUrlLogins = new Suspender(Logins.currentUrl());

    return <MantineProvider theme={theme} defaultColorScheme="auto">
        <Stack p="md" w="100vw" h="100vh">
            <Group justify="space-between" wrap="nowrap">
                <Title textWrap="nowrap">Better Passwork</Title>
                <ActionIcon title="open settings" variant="flat" onClick={() => chrome.runtime.openOptionsPage()}>
                    <Settings/>
                </ActionIcon>
            </Group>
            <Divider label="logins for current URL" />
            <Suspense fallback={<Group p="lg" justify="center"><Loader/></Group>}>
                <LoginList logins={currentUrlLogins} emptyText="(no logins for current URL)" />
            </Suspense>
            <Divider label="search in Passwork" />
            <Search />
        </Stack>
    </MantineProvider>;
}
