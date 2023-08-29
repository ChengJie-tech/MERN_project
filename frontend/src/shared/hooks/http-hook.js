import { useRef, useState, useCallback, useEffect } from "react";

export const useHttpClient = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();

    const activeHttpRequests = useRef([]);

    const sendRequest = useCallback(async (url, method = 'GET', body = null, headers = {}) => {
        setIsLoading(true);

        const httpAbortCtrl = new AbortController();
        activeHttpRequests.current.push(httpAbortCtrl);

        try {
            const response = await fetch(url, {
                method,
                body,
                headers,
                signal: httpAbortCtrl.signal
            });

            const responseData = await response.json();

            activeHttpRequests.current = activeHttpRequests.current.filter(
                r => r !== httpAbortCtrl
            );

            if (!response.ok) {
                throw new Error(responseData.message);
            }

            setIsLoading(false);
            return responseData;
        } catch (error) {
            setError(error.message);
            setIsLoading(false);
            throw error;
        }
    }, []);

    const clearError = () => {
        setError(null);
    };

    useEffect(() => {
        activeHttpRequests.current.forEach(element => element.abort());
    }, []);

    return { isLoading, error, sendRequest, clearError };
};