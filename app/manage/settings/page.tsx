import { SettingForms } from "./components/Forms";

import { getSettings } from "@/app/actions";

export default async function SettingsPage() {
  
  const settings = await getSettings()

  return (
    <div className="flex flex-col w-full gap-space-lg">
        <SettingForms config={settings} />
    </div>
  );
}
