import { useEffect } from "react";
import { useStore } from "@/shared/store/ui";
import { useBrew } from "@/features/brew/store";
import { RECIPES } from "@/features/brew/data/recipes";

// The content of the lectern grimoire. Clicking the book (WitchNook) flies the
// camera to it (Experience/CameraRig) and opens this — an aged two-page spread
// that fades in over the darkened, blurred workshop. The right page is the
// player's Recipe Book: every brew they've discovered, with the rest kept as
// tantalizing locked entries (the secret Thai Tea among them). Copy on the left
// is witchy placeholder About text; edit freely. Close via ✕, backdrop, or Esc.
export default function GrimoireOverlay() {
  const isOpen = useStore((s) => s.grimoireStore.isBookOpen);
  const close = useStore((s) => s.grimoireStore.closeBook);
  const discovered = useBrew((s) => s.discovered);

  // lock page scroll while reading (the scroll-driven camera must not move
  // underneath) and let Escape close the book
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const foundCount = RECIPES.filter((r) => discovered.includes(r.id)).length;

  return (
    <div
      className={`grimoire${isOpen ? " open" : ""}`}
      onClick={close}
      aria-hidden={!isOpen}
    >
      {/* stop backdrop-close when interacting with the pages themselves */}
      <div className="grimoire-book" onClick={(e) => e.stopPropagation()}>
        <button className="grimoire-close" onClick={close} aria-label="Close the grimoire">
          ✕
        </button>

        <div className="grimoire-page grimoire-page-left">
          <p className="grimoire-chapter">Chapter I</p>
          <h2 className="grimoire-title">The Witch of the Web</h2>
          <p className="grimoire-body">
            Aumster keeps a workshop where tangled interfaces are boiled down,
            re-brewed, and poured out gleaming. A developer by day and, by
            candlelight, an apothecary of the web — coaxing plain requirements
            into small, well-made enchantments.
          </p>
          <p className="grimoire-body">
            Every project here began as raw ingredients in the pot. Stir long
            enough and the mundane starts to shimmer.
          </p>

          {/* Portrait of the witch — drop your splash art in later by replacing
              this block with: <img className="grimoire-portrait" src="…" alt="Aumster" /> */}
          <div
            className="grimoire-portrait grimoire-portrait-empty"
            role="img"
            aria-label="Portrait of the witch (placeholder)"
          >
            <span className="grimoire-portrait-hat" aria-hidden="true">
              ✦
            </span>
            <span>
              your witch portrait,
              <br />
              pinned here soon
            </span>
          </div>
        </div>

        <div className="grimoire-spine" aria-hidden="true" />

        <div className="grimoire-page grimoire-page-right">
          <p className="grimoire-chapter">The Recipe Book</p>
          <h2 className="grimoire-title">Recipes Kept</h2>
          <p className="grimoire-count">
            {foundCount} of {RECIPES.length} brews discovered
          </p>

          <div className="grimoire-recipes">
            {RECIPES.map((r) => {
              const found = discovered.includes(r.id);
              if (found) {
                return (
                  <div
                    key={r.id}
                    className={`grimoire-recipe${r.secret ? " secret" : ""}`}
                  >
                    <span className="grimoire-recipe-icon">{r.icon}</span>
                    <div className="grimoire-recipe-body">
                      <div className="grimoire-recipe-name">
                        {r.name}
                        {r.secret ? " ✦" : ""}
                      </div>
                      <div className="grimoire-recipe-note">{r.blurb}</div>
                    </div>
                  </div>
                );
              }
              // locked — secrets are extra-mysterious to bait experimentation
              return (
                <div key={r.id} className="grimoire-recipe locked">
                  <span className="grimoire-recipe-icon">{r.secret ? "🔒" : "❔"}</span>
                  <div className="grimoire-recipe-body">
                    <div className="grimoire-recipe-name">? ? ?</div>
                    <div className="grimoire-recipe-note">
                      {r.secret
                        ? "a secret brew — on no menu. found only by pouring it right."
                        : "undiscovered — brew it well to record it here."}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="grimoire-hint">click anywhere to close the book</p>
    </div>
  );
}
