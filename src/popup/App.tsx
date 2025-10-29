import "@mantine/core/styles.css";

import { ActionIcon, Button, Checkbox, Group, MantineProvider, Stack, Text, Title } from '@mantine/core'
import { theme } from '@/common/theme'
import { Settings } from 'react-feather'
import { useEffect, useState } from 'react'
import Browser from 'webextension-polyfill'
import Storage from "@/common/storage";
import Overview from "./Overview";

interface ConfigSteps {
    checked: boolean
    url: boolean,
    key: boolean,
    origin: boolean
}

export default function App() {
    const [configSteps, setConfigSteps] = useState<ConfigSteps>({
        checked: false,
        key: false,
        origin: false,
        url: false
    });
    const [url, setUrl] = useState<URL | null>(null);

    useEffect(() => {
        const checkConfiguration = async () => {
            const store = await Storage.get("sync", {url: null, key: null});
            let newSteps = {
                checked: true,
                key: false,
                origin: false,
                url: false
            };

            if (store.key) {
                newSteps.key = true;
            }

            let url;
            if (store.url) {
                try {
                    url = new URL(store.url);
                    newSteps.url = true;
                    
                    setUrl(url);
                } catch (e) {
                    newSteps.url = false;
                }
            }

            if (url) {
                const {origins} = await Browser.permissions.getAll();
            
                if (!origins?.includes("<all_urls>") && !origins?.includes(url.origin + "/*")) {
                    newSteps.origin = false;
                } else {
                    newSteps.origin = true;
                }
            }
            
            setConfigSteps(newSteps);
        }

        checkConfiguration();

        Browser.storage.sync.onChanged.addListener(checkConfiguration);
        Browser.permissions.onAdded.addListener(checkConfiguration);
        Browser.permissions.onRemoved.addListener(checkConfiguration);

        () => {
            Browser.storage.sync.onChanged.removeListener(checkConfiguration);
            Browser.permissions.onAdded.removeListener(checkConfiguration);
            Browser.permissions.onRemoved.removeListener(checkConfiguration);
        }
    }, []);

    return <MantineProvider theme={theme} defaultColorScheme="auto">
        <Stack p="md" w="100vw" h="100vh" justify="center" align="center">
            <Group justify="space-between" wrap="nowrap" w="100%">
                <Title textWrap="nowrap">Better Passwork</Title>
                <ActionIcon title="open settings" variant="light" size="xl" onClick={() => Browser.runtime.openOptionsPage()}>
                    <Settings/>
                </ActionIcon>
            </Group>
            {configSteps.checked && (!configSteps.key || !configSteps.url || !configSteps.origin) ?
                <Stack flex={1} justify="start" pt="lg" align="start" gap="xs">
                    <Text>Welcome to Better Passwork. To get you started, a few things must be configured:</Text>
                    <Group>
                        <Checkbox readOnly label="Passwork URL set in options" checked={configSteps.url} />
                        {!configSteps.url && <Button variant="subtle" onClick={() => Browser.runtime.openOptionsPage()}>Options</Button>}
                    </Group>
                    <Group>
                        <Checkbox readOnly label="Passwork API Key set in options" checked={configSteps.key} />
                        {!configSteps.key && <Button variant="subtle" onClick={() => Browser.runtime.openOptionsPage()}>Options</Button>}
                    </Group>
                    <Group>
                        <Checkbox readOnly label="Permission to call Passwork API granted" checked={configSteps.origin} />
                        {!configSteps.origin && <Button variant="subtle" onClick={async () => {   
                            if (!url) {
                                return;
                            }

                            Browser.permissions.request({origins: [url.origin + "/*"]});
                            window.close();
                        }}>Allow</Button>}
                    </Group>
                </Stack>
            : <Overview />}
        </Stack>
    </MantineProvider>;
}
