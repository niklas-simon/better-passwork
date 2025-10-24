import { useForm } from "@mantine/form";
import { Options, OptionsStorage } from "../common/storage";
import Suspender from "../common/suspender";
import { Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import useMonostable from "../common/useMonostable";

export interface OptionsProps {
    options: Suspender<Options>
}

export default function OptionsForm({options: s_options}: OptionsProps) {
    const options = s_options.read();
    const [showSaved, setSaved] = useMonostable(1000);

    const form = useForm({
        initialValues: options,
        mode: "uncontrolled",
        enhanceGetInputProps: ({form}) => {
            return {
                disabled: form.submitting
            }
        }
    });

    return <form onSubmit={form.onSubmit(async (values) => {
        await OptionsStorage.set({
            key: values.key.trim(),
            url: values.url.trim()
        });

        setSaved();
    })}>
        <Stack>
            <TextInput
                withAsterisk
                label="Passwork-URL"
                placeholder="https://passwork.example.com"
                description="URL to your Passwork, without trailing slash"
                key={form.key("url")}
                {...form.getInputProps("url")}
            />
            <PasswordInput
                withAsterisk
                label="API-Key"
                placeholder="your API Key"
                description="found in your Passwork under 'My Account' > 'API-Settings' > 'Personal API Key'"
                key={form.key("key")}
                {...form.getInputProps("key")}
            />
            <Button type="submit" color={showSaved ? "green" : undefined}>Save</Button>
        </Stack>
    </form>
}