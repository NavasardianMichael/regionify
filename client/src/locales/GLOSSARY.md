# i18n glossary (`common` namespace)

Decisions for translators and future strings. Locale files: `en`, `de`, `es`, `fr`, `pt`, `ru`, `zh`.

## Public map embed

| Locale | Preferred term                          | Notes                                         |
| ------ | --------------------------------------- | --------------------------------------------- |
| EN     | embed                                   | Source copy                                   |
| DE     | **Einbettung** / öffentliche Einbettung | Web-standard noun; avoids loanword “Embed”    |
| ES     | **incrustación** / incrustación pública | Consistent with `title` and modals            |
| FR     | intégration                             | Existing pattern; unchanged                   |
| PT     | **incorporação** / incorporação pública | pt-PT-friendly; avoids anglicism in body copy |
| RU     | вставка                                 | Existing pattern; unchanged                   |
| ZH     | 嵌入                                    | Existing pattern; unchanged                   |

**iframe** stays as **iframe** (widely recognized technical term).

## Google Sheets

- **Product name:** Keep “Google Sheets” in UI that refers to the product (connect, import, column hints) where the English UI does the same.
- **Short format label:** May use localized shorthand (e.g. DE `Tabellen`, ES `Hojas`) in segmented controls; FR may keep **Sheets** next to CSV/Excel for parity with Google branding.

## Paid plan tier names (Observer / Explorer / Chronographer)

- Localized marketing names are OK (e.g. DE Chronograph, ES Cronógrafo, ZH 纪时者) as long as they stay distinct per tier.
- Descriptions must preserve meaning of English features (e.g. **time-series** import, not “temporary” import).

## Spanish (`es`): register

- **Informal _tú_** in product UI (imperatives and questions to the user).
- Avoid mixed _usted_ (e.g. use _Elimina_, not _Elimine_, in inline help).

## Sample / template download (errors)

- English uses **sample**; some locales use **Vorlage** / **plantilla** / **exemplo** / **образец**. Within a single locale, keep error messages aligned with the main download action label where possible.
