import { atom, useAtom } from "jotai";

interface HUD {
  value: string;
  type: "empty" | "error" | "success" | "loading";
  id: string;
}

export const hudAtom = atom<HUD>({ value: "", type: "empty", id: "" });

export function useHUD() {
  const [hud, setHUD] = useAtom(hudAtom);

  const showHUD = (value: string, type: HUD["type"]) => {
    const uuid = crypto.randomUUID();
    setHUD({ value, type, id: uuid });
    setTimeout(() => {
      setHUD((currentHUD) =>
        currentHUD.id === uuid
          ? { value: "", type: "empty", id: "" }
          : currentHUD,
      );
    }, 3000);
  };

  return [hud, showHUD] as const;
}
