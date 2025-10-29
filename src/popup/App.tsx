import "@mantine/core/styles.css";

import { ActionIcon, Group, MantineProvider, Stack, Text, Title } from '@mantine/core'
import { theme } from '@/common/theme'
import { Settings } from 'react-feather'
import { useEffect, useState } from 'react'
import Browser from 'webextension-polyfill'
import Storage from "@/common/storage";
import Overview from "./Overview";
import Setup, { ConfigSteps } from "./Setup";

export default function App() {
    const [configSteps, setConfigSteps] = useState<ConfigSteps>({
        checked: false,
        key: false,
        origin: false,
        url: false
    });
    const [url, setUrl] = useState<URL | null>(null);
    const [tab, setTab] = useState<string>("overview");

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

            return newSteps;
        }

        checkConfiguration().then(configSteps => {
            if (configSteps.checked && (!configSteps.key || !configSteps.url || !configSteps.origin)) {
                setTab("config");
            }
        });

        Browser.storage.sync.onChanged.addListener(checkConfiguration);
        Browser.permissions.onAdded.addListener(checkConfiguration);
        Browser.permissions.onRemoved.addListener(checkConfiguration);

        () => {
            Browser.storage.sync.onChanged.removeListener(checkConfiguration);
            Browser.permissions.onAdded.removeListener(checkConfiguration);
            Browser.permissions.onRemoved.removeListener(checkConfiguration);
        }
    }, []);

    let TabEl;
    switch (tab) {
        case "overview":
            TabEl = <Overview />;
            break;
        case "setup":
            TabEl = <Setup configSteps={configSteps} url={url} />;
            break;
        default:
            TabEl = <Text>nothing to display. This shouldn't happen.</Text>
            break;
    }

    return <MantineProvider theme={theme} defaultColorScheme="auto">
        <Stack p="md" w="100vw" h="100vh" justify="center" align="center">
            <Group justify="space-between" wrap="nowrap" w="100%">
                <Title textWrap="nowrap">Better Passwork</Title>
                <ActionIcon title="open settings" variant="light" size="xl" onClick={() => Browser.runtime.openOptionsPage()}>
                    <Settings/>
                </ActionIcon>
            </Group>
            {TabEl}
        </Stack>
    </MantineProvider>;
}
