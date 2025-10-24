import { Group, Loader, Stack, TextInput } from "@mantine/core";
import { Suspense, useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { Search as SearchIcon } from "react-feather";
import Logins, { TinyLogin } from "../common/logins";
import Suspender from "../common/suspender";
import LoginList from "./LoginList";

export default function Search({flex}: {flex?: number}) {
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 500);
    const results = useMemo(() => {
        if (!debouncedSearch.trim()) {
            return null;
        }

        return new Suspender<TinyLogin[], string>(Logins.search(debouncedSearch.trim()))
    }, [debouncedSearch]);

    return <Stack flex={flex} mih={0}>
        <TextInput
            leftSection={<SearchIcon />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search for logins"
        />
        {results && <Suspense fallback={<Group p="lg" justify="center"><Loader /></Group>}>
            <LoginList logins={results} flex={1} emptyText="(no results for search term)" />
        </Suspense>}
    </Stack>
}