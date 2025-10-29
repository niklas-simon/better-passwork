import { Stack, Group, Checkbox, Button, Text } from "@mantine/core";
import Browser from "webextension-polyfill";

export interface ConfigSteps {
    checked: boolean
    url: boolean,
    key: boolean,
    origin: boolean
}

export default function Setup({configSteps, url}: {configSteps: ConfigSteps, url: URL | null}) {
    return <Stack flex={1} justify="start" pt="lg" align="start" gap="xs">
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
}