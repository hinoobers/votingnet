// Refresh the page every x seconds to always see the latest results

setTimeout(() => {
    const scroll = window.scrollY;
    window.location.reload();
    window.scrollTo(0, scroll);
}, 2000);
