export function toast(msg, err) {
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}


export function ask(title, { reason = false, required = false, ok = "Ya" } = {}) {
  return new Promise(res => {
    const o = document.createElement("div");
    o.className = "ov";
    o.innerHTML = `<div class="dlg"><h3></h3>${reason ? `<textarea placeholder="Alasan${required ? " (wajib)" : " (opsional)"}"></textarea>` : ""}
      <div class="btns"><button class="btn" data-x>Batal</button><button class="btn pri" data-ok></button></div></div>`;
    o.querySelector("h3").textContent = title;
    o.querySelector("[data-ok]").textContent = ok;
    document.body.appendChild(o);
    const done = v => { o.remove(); res(v); };
    o.querySelector("[data-x]").onclick = () => done(null);
    o.querySelector("[data-ok]").onclick = () => {
      const v = reason ? o.querySelector("textarea").value.trim() : "";
      if (required && !v) return toast("Alasan wajib diisi", true);
      done(v);
    };
  });
}