export default class Suspender<T, E = any> {
    private p: Promise<T>;
    private res: T | undefined;
    private error: E | undefined;
    private resolved = false;

    constructor(_p: Promise<T>) {
        this.p = _p;

        _p
            .then(_res => this.res = _res)
            .catch(_error => this.error = _error)
            .finally(() => this.resolved = true);
    }

    public isError(): boolean {
        if (!this.resolved) {
            throw this.p;
        }

        return typeof this.error !== "undefined";
    }

    public read(): T {
        if (!this.resolved) {
            throw this.p;
        }

        if (this.res) {
            return this.res;
        }

        throw this.error;
    }

    public err(): E {
        if (!this.resolved) {
            throw this.p;
        }
        
        if (this.error) {
            return this.error;
        }
        
        throw "no error in Suspender";
    }
}