(() => {
    'use strict'
    const setTheme = () => {
        document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    }

    setTheme()

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        setTheme()
    })
})()