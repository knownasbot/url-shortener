const urlInput = document.querySelector("input#url");
const shortBtn = document.querySelector("button#short");
const shortCount = document.querySelector("#shortCount");
const responseDiv = document.querySelector(".response");
const historyTable = document.querySelector(".history > .container > table > tbody");

const host = location.protocol + "//" + location.host;
const buttonText = shortBtn.innerText = "Short 👌";

let lastCount = 0;
let loadInterval;

fetchShortenCount();
setInterval(fetchShortenCount, 60000);

shortBtn.addEventListener("click", () => {
    const errorDiv = responseDiv.querySelector(".error");
    const successDiv = responseDiv.querySelector(".success");

    const url = urlInput.value;

    errorDiv.hidden = true;
    successDiv.hidden = true;

    try {
        const validator = new URL(url);
        if (!/^https?:$/.test(validator.protocol)) throw new Error();

        toggleButtonLoad(true);
        urlInput.classList.remove("error");

        fetch("/api/short", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: validator.href
            })
        })
            .then(async (res) => {
                const data = await res.json();

                if (data.success) {
                    setTimeout(() => {
                        const linkElem = responseDiv.querySelector("#shortenedURL");
                        linkElem.href = linkElem.innerText = host + "/" + data.message;

                        toggleButtonLoad(false);
                        storeHistory(validator.href, data.message);
                        updateHistoryTable();

                        successDiv.hidden = false;
                    }, 2000);
                } else {
                    toggleButtonLoad(false);
                    errorDiv.hidden = false;

                    urlInput.classList.add("error");
                }
            })
            .catch((e) => {
                errorDiv.hidden = false;

                toggleButtonLoad(false);
                urlInput.classList.add("error");

                console.error("Failed to short the URL:", e);
            });
    } catch {
        toggleButtonLoad(false);
        urlInput.classList.add("error");
    }
});

urlInput.addEventListener("keyup", () => urlInput.classList.remove("error"));

function fetchShortenCount() {
    fetch("/api/info")
        .then(async (res) => {
            const data = await res.json();

            if (data.success) {
                setTimeout(() => {
                    setShortCount(lastCount > 0 ? lastCount : 0, data.count);
                    lastCount = data.count;
                }, 1000);
            }
        })
        .catch((e) => {
            console.error("Failed to fetch shortened count:", e);
        });
}

function setShortCount(start = 0, end) {
    const interval = setInterval(() => {
        if (Math.ceil(start) == end) {
            clearInterval(interval);
        }

        start += (end - start) / 10;
        if (start > end) start = end;

        shortCount.innerText = Math.ceil(start);
    }, 1000 / 20);
}

function toggleButtonLoad(enable) {
    if (enable) {
        let add = true;

        shortBtn.disabled = true;
        shortBtn.innerText = "🚀";
        shortBtn.style.cursor = "wait";

        loadInterval = setInterval(() => {
            if (shortBtn.innerText.match(/🚀/g).length >= 3) {
                add = false;
            } else if (shortBtn.innerText.length <= 2) {
                add = true;
            }

            if (add) {
                shortBtn.innerText += "🚀";
            } else {
                shortBtn.innerText = shortBtn.innerText.substr(0, shortBtn.innerText.length - 2);
            }
        }, 1000);
    } else {
        clearInterval(loadInterval);

        shortBtn.disabled = false;
        shortBtn.innerText = buttonText;
        shortBtn.style.cursor = "pointer";
    }
}

function storeHistory(url, code) {
    localStorage.setItem("history",
        (localStorage.getItem("history") ?? "") + `${btoa(url)}+${code}+${Date.now()};`
    );
}

function getHistory() {
    const history = [];
    const storedData = localStorage.getItem("history");

    if (storedData) {
        for (let v of storedData.split(";")) {
            v = v.split("+");
            if (v.length < 3) continue;

            history.push({
                url: atob(v[0]),
                code: v[1],
                time: new Date(Number(v[2]))
            });
        }
    }

    history.sort((a, b) => b.time.getTime() - a.time.getTime());

    return history;
}

function updateHistoryTable() {
    const history = getHistory();
    if (history.length < 1) return;

    document.querySelector(".history").hidden = false;

    while (historyTable.childElementCount != 1)
        historyTable.deleteRow(1);

    for (let v of history) {
        if (!v.code) continue;

        const urlElem = document.createElement("a");
        urlElem.href = urlElem.innerText = v.url;

        const shortElem = document.createElement("a");
        shortElem.href = shortElem.innerText = host + "/" + v.code;

        const dateElem = document.createElement("p");
        dateElem.innerText = v.time.toLocaleDateString();

        const row = historyTable.insertRow();

        const urlCell = row.insertCell();
        const shortCell = row.insertCell();
        const dateCell = row.insertCell();
        urlCell.append(urlElem);
        shortCell.append(shortElem);
        dateCell.append(dateElem);
    }
}

updateHistoryTable();