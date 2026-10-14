/**
 * Form fields from the Figma "input/standard/filled" component: 56px tall,
 * 24px radius, black/10 border on surface-low. Empty: the label sits in the
 * middle like a placeholder (16px, outline). Focused or filled: it shrinks
 * to a 10px caption above the value — pure CSS (`:placeholder-shown`).
 *
 *   Maso.fields.text({ name, label, value, error, attrs, cls })
 *   Maso.fields.textarea({ … })
 *   Maso.fields.select({ name, label, value, error, disabled })   looks like a field, opens a picker
 *   Maso.fields.searchBox({ placeholder, label })
 *   Maso.fields.setError(wrapper, message | null)                 show / clear an error in place
 *
 * Every field is wrapped in `<div data-field="name">`.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, cx, dom } = Maso;

  const SHELL =
    "relative flex h-14 w-full items-center rounded-[24px] border bg-surface-low px-4 transition-[border-color,box-shadow] duration-300";
  const OK_BORDER = "border-black-10 focus-within:border-primary/40";
  const LABEL_MOVE = [
    "peer-focus:text-10 peer-focus:text-on-surface-var",
    "peer-[:not(:placeholder-shown)]:text-10 peer-[:not(:placeholder-shown)]:text-on-surface-var",
  ].join(" ");

  let uid = 0;
  const nextId = () => `f${++uid}`;

  const errorLine = (id, message) => (message ? html`<p id="${id}-err" role="alert" class="mt-1 ps-4 text-10 text-error">${message}</p>` : "");

  /** Extra attributes as a trusted string: { inputmode: "tel", dir: "ltr" } */
  const attrString = (attrs = {}) =>
    Maso.raw(
      Object.entries(attrs)
        .filter(([, v]) => v !== false && v !== undefined && v !== null)
        .map(([k, v]) => (v === true ? k : `${k}="${String(v).replace(/"/g, "&quot;")}"`))
        .join(" "),
    );

  function text({ name, label, value = "", error, attrs, cls = "" }) {
    const id = nextId();
    return html`
      <div data-field="${name}" data-id="${id}" class="${cx("min-w-0 flex-1", cls)}">
        <label data-shell class="${cx(SHELL, error ? "border-error" : OK_BORDER)}">
          <input
            name="${name}"
            value="${value}"
            placeholder=" "
            ${attrString(attrs)}
            ${error ? html`aria-invalid="true" aria-describedby="${id}-err"` : ""}
            class="peer h-full w-full bg-transparent pt-4 text-16 text-on-surface outline-none [&[dir=ltr]]:text-right"
          />
          <span
            class="${cx(
              "pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-16 text-outline transition-all duration-200 ease-out-expo",
              "peer-focus:top-[15px] peer-[:not(:placeholder-shown)]:top-[15px]",
              LABEL_MOVE,
            )}"
            >${label}</span
          >
        </label>
        ${errorLine(id, error)}
      </div>
    `;
  }

  /** Multi-line variant (95px): the label waits at the top like a placeholder */
  function textarea({ name, label, value = "", error, attrs, cls = "" }) {
    const id = nextId();
    return html`
      <div data-field="${name}" data-id="${id}" class="${cx("min-w-0 flex-1", cls)}">
        <label data-shell class="${cx(SHELL, "h-[95px] items-start py-0", error ? "border-error" : OK_BORDER)}">
          <textarea
            name="${name}"
            placeholder=" "
            ${attrString(attrs)}
            class="peer no-scrollbar h-full w-full resize-none bg-transparent pt-6 pb-2 text-16 text-on-surface outline-none"
          >
${value}</textarea
          >
          <span
            class="${cx(
              "pointer-events-none absolute start-4 top-4 text-16 text-outline transition-all duration-200 ease-out-expo",
              "peer-focus:top-2 peer-[:not(:placeholder-shown)]:top-2",
              LABEL_MOVE,
            )}"
            >${label}</span
          >
        </label>
        ${errorLine(id, error)}
      </div>
    `;
  }

  /** Looks like a field, opens a picker sheet (province / city) */
  function select({ name, label, value, error, disabled }) {
    const id = nextId();
    return html`
      <div data-field="${name}" data-id="${id}" class="min-w-0 flex-1">
        <button
          type="button"
          data-action="pick"
          data-pick="${name}"
          ${disabled ? html`disabled` : ""}
          aria-haspopup="dialog"
          ${error ? html`aria-describedby="${id}-err"` : ""}
          data-shell
          class="${cx(SHELL, "justify-between pe-2 text-start disabled:opacity-50", error ? "border-error" : "border-black-10 hover:border-primary/40")}"
        >
          <span class="${cx("truncate text-16", value ? "text-on-surface" : "text-outline")}">${value || label}</span>
          <span class="flex w-10 shrink-0 justify-center text-on-surface">${icon("chevronDown")}</span>
          ${value && html`<span class="sr-only">${label}</span>`}
        </button>
        ${errorLine(id, error)}
      </div>
    `;
  }

  /** 32px search box (city picker, map): #e8e8e8 fill, outline border, icon on the right */
  function searchBox({ placeholder, label, cls = "" }) {
    return html`
      <label class="${cx("flex h-8 w-full items-center gap-2 rounded-[16px] border border-outline bg-[#e8e8e8] px-2 focus-within:border-primary", cls)}">
        ${icon("search", { cls: "shrink-0 text-on-surface" })}
        <input
          type="search"
          autocomplete="off"
          placeholder="${placeholder}"
          aria-label="${label}"
          enterkeyhint="search"
          class="h-full min-w-0 flex-1 bg-transparent text-16 text-on-surface outline-none placeholder:text-on-surface-var [&::-webkit-search-cancel-button]:appearance-none"
        />
      </label>
    `;
  }

  /** Shows or clears the error of one field without redrawing it (keeps focus and caret) */
  function setError(wrapper, message) {
    if (!wrapper) return;
    const id = wrapper.dataset.id;
    const shell = dom.$("[data-shell]", wrapper);
    const control = dom.$("input, textarea, button", wrapper);
    const isButton = control.tagName === "BUTTON";
    shell.classList.remove("border-error", "border-black-10", "focus-within:border-primary/40", "hover:border-primary/40");
    if (message) shell.classList.add("border-error");
    else shell.classList.add("border-black-10", isButton ? "hover:border-primary/40" : "focus-within:border-primary/40");

    dom.$(`#${id}-err`, wrapper)?.remove();
    if (message) {
      wrapper.insertAdjacentHTML("beforeend", String(errorLine(id, message)));
      control.setAttribute("aria-describedby", `${id}-err`);
      if (!isButton) control.setAttribute("aria-invalid", "true");
    } else {
      control.removeAttribute("aria-describedby");
      control.removeAttribute("aria-invalid");
    }
  }

  Maso.fields = { text, textarea, select, searchBox, setError };
})();
