import useMonostable from "@/common/useMonostable";
import { ActionIcon, ActionIconProps, PolymorphicComponentProps } from "@mantine/core";
import { useCallback, useState } from "react";

interface FeedbackActionProps extends Omit<PolymorphicComponentProps<"button", ActionIconProps>, "loading"> {
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<unknown>
}

export default function FeedbackAction(props: FeedbackActionProps) {
    const [isSuccess, setIsSuccess] = useState(true);
    const [showResult, setShowResult] = useMonostable(1000);
    const [loading, setLoading] = useState(false);

    const setResult = useCallback((r: boolean) => {
        setLoading(false);
        setIsSuccess(r);
        setShowResult();
    }, []);

    return <ActionIcon {...props} 
        color={showResult ? isSuccess ? "green" : "red" : props.color}
        loading={loading}
        onClick={async (e) => {
            try {
                setLoading(true);
                
                await props.onClick(e);

                setResult(true);
            } catch (e) {
                setResult(false);

                throw e;
            }
        }}
    />
}