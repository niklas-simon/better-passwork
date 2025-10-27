import "@mantine/core/styles.css";

import Suspender from '@/common/suspender'
import Logins from '@/common/logins'
import { ActionIcon, Divider, Group, Loader, MantineProvider, Stack, Title } from '@mantine/core'
import { theme } from '@/common/theme'
import { Settings } from 'react-feather'
import { Suspense, useMemo } from 'react'
import LoginList from './LoginList'
import Search from './Search'
import Browser from 'webextension-polyfill'

export default function App() {
  const currentUrlLogins = useMemo(() => new Suspender(Logins.currentUrl()), []);

    return <MantineProvider theme={theme} defaultColorScheme="auto">
        <Stack p="md" w="100vw" h="100vh">
            <Group justify="space-between" wrap="nowrap">
                <Title textWrap="nowrap">Better Passwork</Title>
                <ActionIcon title="open settings" variant="light" size="xl" onClick={() => Browser.runtime.openOptionsPage()}>
                    <Settings/>
                </ActionIcon>
            </Group>
            <Divider label="logins for current URL" />
            <Suspense fallback={<Group p="lg" justify="center"><Loader/></Group>}>
                <LoginList mah={100} logins={currentUrlLogins} emptyText="(no logins for current URL)" />
            </Suspense>
            <Divider label="search in Passwork" />
            <Search flex={1}/>
        </Stack>
    </MantineProvider>;
}
