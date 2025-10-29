import { Stack, Group, Checkbox, Button, Text } from "@mantine/core";
import Browser from "webextension-polyfill";

export interface ConfigSteps {
    checked: boolean
    url: boolean,
    key: boolean,
    origin: boolean
}

export default function Setup({configSteps}: {configSteps: ConfigSteps}) {
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
            <Checkbox readOnly label="Permission to access all web sites granted" checked={configSteps.origin} />
            {!configSteps.origin && <Button variant="subtle" onClick={async () => {
                Browser.permissions.request({origins: ["<all_urls>"]});
                window.close();
            }}>Allow</Button>}
        </Group>
    </Stack>
}