import "@mantine/core/styles.css";
import { Loader, MantineProvider, Stack } from "@mantine/core";
import { theme } from "../common/theme";
import OptionsForm from "./OptionsForm";
import Suspender from "../common/suspender";
import { OptionsStorage } from "../common/storage";
import { Suspense } from "react";

export default function App() {
    const options = new Suspender(OptionsStorage.get());

    return <MantineProvider theme={theme} defaultColorScheme="auto">
        <Stack align="center" justify="center" p="lg" w="100vw" h="100vh">
            <Suspense fallback={<Loader />}>
                <OptionsForm options={options} />
            </Suspense>
        </Stack>
    </MantineProvider>;
}
