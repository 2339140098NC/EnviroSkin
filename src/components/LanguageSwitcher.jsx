import { useI18n } from "../i18n/I18nProvider";

function LanguageSwitcher() {
	const { language, setLanguage, t } = useI18n();

	return (
		<label className="glass-surface inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-slate-700">
			<span>{t("Language")}</span>
			<select
				value={language}
				onChange={(event) => setLanguage(event.target.value)}
				className="bg-transparent text-xs font-semibold outline-none"
			>
				<option value="en">{t("English")}</option>
				<option value="es">{t("Spanish")}</option>
				<option value="fr">{t("French")}</option>
				<option value="it">{t("Italian")}</option>
				<option value="ko">{t("Korean")}</option>
				<option value="zh">{t("Chinese")}</option>
				<option value="ar">{t("Arabic")}</option>
				<option value="sg">{t("Sango")}</option>
				<option value="so">{t("Somali")}</option>
				<option value="st">{t("Sesotho")}</option>
				<option value="pt">{t("Portuguese")}</option>
			</select>
		</label>
	);
}

export default LanguageSwitcher;
