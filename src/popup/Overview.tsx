import { Stack, Group, Divider, Loader } from "@mantine/core";
import { Suspense, useMemo } from "react";
import LoginList from "./LoginList";
import Logins from "@/common/logins";
import Suspender from "@/common/suspender";
import Search from "./Search";

export default function Overview() {
    const currentUrlLogins = useMemo(() => new Suspender(Logins.currentUrl()), []);
    
    return <Stack flex={1} w="100%">
        <Divider label="logins for current URL" />
        <Suspense fallback={<Group p="lg" justify="center"><Loader/></Group>}>
            <LoginList mah={100} logins={currentUrlLogins} emptyText="(no logins for current URL)" />
        </Suspense>
        <Divider label="search in Passwork" />
        <Search flex={1}/>
    </Stack>
}