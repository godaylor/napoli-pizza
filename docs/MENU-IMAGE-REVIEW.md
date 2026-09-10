# Menu image correspondence — 2026-09-10

All 36 products use distinct local photographs. Three existing photographs remain active: 101 `pizza-margherita`, 104 `pizza-funghi`, 112 `pizza-verdure`. All eight previous PNG masters and all 48 previous responsive derivatives remain unchanged on disk, including inactive category still lifes. Product IDs, slugs, prices, descriptions, availability and other business data are unchanged.

33 replacement masters were generated with the built-in imagegen tool using existing category photographs and the three user-approved previews as references. No external image URL, paid API/CLI fallback, or stock-image substitution was used. The approved 103/302/502 PNGs were copied byte-for-byte. Each new master has 480/960 AVIF, WebP and JPEG derivatives. Generation preserves category-specific stone backgrounds, light, blue linen and serving style.

## Visual review

Reviewed every source against category, name and description: distinct pizza toppings (including cheese-free Marinara), correct combo item counts, separate snacks, individual drinks, dessert portions, and four distinct sauces. Family combo description specifies counts but not exact pizza flavours; its image illustrates three pizzas, two sides and four drinks without changing that description. Water labels distinguish carbonation. Pepperoni and Evening for two RU/EN alt text now matches the corrected photographs.

## Asset provenance and prompts

Original master location: `src/assets/menu/masters/`. Responsive files: `public/menu/`. New filename stem equals product slug. Prior image provenance remains as documented in ASSET-LICENSES.md; this record does not assign a license to earlier images.

### 102 — pepperoni-napoli

Master: `src/assets/menu/masters/pepperoni-napoli.png`.

Built-in generated file: `exec-52cfd0a4-454c-4ee0-8676-098a2bc9409d.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: Pepperoni pizza: spicy pepperoni discs, melted mozzarella, tomato sauce, clearly visible thin red onion crescents and oregano. No basil, no chili rings. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 103 — mortadella-pistachio

Master: `src/assets/menu/masters/mortadella-pistachio.png`.

User-approved preview, copied without alteration.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli catalog photograph for product Мортаделла и фисташка. Input images are style references from the pizza category, not the target food. Match their overhead view, pale gray stone background, soft directional daylight, charcoal slate corner, small blue linen corner, tight centered full pizza framing, naturally blistered airy Neapolitan crust. Subject: one whole WHITE pizza with thin folded pink mortadella, generous creamy stracciatella, chopped green pistachios and fine lemon zest. These are the exact toppings. No tomato sauce, basil, mushrooms, pepperoni, extra dishes or scattered ingredients. Natural appetizing textures and realistic food photography, consistent lighting and scale with reference. Complete crust in frame. No text, logos, watermark. New preview only; preserve all original files.

References: The corresponding category originals; see artifacts/image-preview-review/PREVIEW-PROMPTS.md.

### 105 — quattro-formaggi

Master: `src/assets/menu/masters/quattro-formaggi.png`.

Built-in generated file: `exec-beb00a0d-725b-4448-a820-9f518eee60a9.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: White four-cheese pizza: mozzarella, small blue-veined gorgonzola patches, melted taleggio and parmesan on cream base. No mushrooms, no herbs, no meat, no tomato. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 106 — diavola

Master: `src/assets/menu/masters/diavola.png`.

Built-in generated file: `exec-d1b4d989-ef8f-4827-9a4b-522dfabf9b64.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: Spicy pizza with salami discs, irregular small red nduja dollops, tomato sauce, mozzarella and clearly visible green jalapeno rings. No basil. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 107 — prosciutto-rucola

Master: `src/assets/menu/masters/prosciutto-rucola.png`.

Built-in generated file: `exec-e3a25356-2d84-4bab-af17-9b9a1bfe54bb.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: Pizza with tomato sauce and mozzarella, delicate folded prosciutto crudo slices, fresh arugula leaves and shaved parmesan. No basil. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 108 — melanzana

Master: `src/assets/menu/masters/melanzana.png`.

Built-in generated file: `exec-9af4b03f-e3d3-419d-9057-0be75e5203b0.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: Vegetarian pizza with roasted eggplant slices (purple skin), tomato sauce, white ricotta dollops, basil and pecorino. No zucchini, no peppers, no burrata. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 109 — pollo-pesto

Master: `src/assets/menu/masters/pollo-pesto.png`.

Built-in generated file: `exec-506038c9-3de2-4021-aa38-15294b6369a0.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: Pizza with roasted chicken pieces, green pesto, melted mozzarella, deep red sun-dried tomatoes and zucchini slices. No peppers, no burrata. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 110 — salsiccia

Master: `src/assets/menu/masters/salsiccia.png`.

Built-in generated file: `exec-b59b4fa0-07b5-4509-a0bd-8c66d7c9293b.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: White pizza with browned crumbled Italian sausage (not pepperoni discs), thin golden potato slices, rosemary and smoked mozzarella. No tomato or basil. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 111 — marinara

Master: `src/assets/menu/masters/marinara.png`.

Built-in generated file: `exec-6cb10184-2a70-407f-a9b3-fe1d441066b5.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: Marinara pizza, red crushed tomato sauce, visible thin garlic slices, dried oregano, olive oil. Absolutely NO CHEESE, meat or basil. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 113 — carbonara

Master: `src/assets/menu/masters/carbonara.png`.

Built-in generated file: `exec-306e9564-6a14-4a33-9f66-f71d14f4e242.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: White Carbonara pizza: crisp guanciale pieces, pecorino, melted mozzarella, one glossy orange egg yolk at center and black pepper. No mushrooms, herbs or tomatoes. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 114 — tonno-cipolla

Master: `src/assets/menu/masters/tonno-cipolla.png`.

Built-in generated file: `exec-3c2df43d-8bca-44c0-b8cf-7759b1499346.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down centered whole Neapolitan pizza with complete airy blistered crust in frame, charcoal slate corner, same scale as pizza reference. Subject: Pizza with tuna flakes, thin red onion crescents, capers, tomato sauce and mozzarella. No salami, no basil. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mortadella-pistachio-preview-v1.png`, `public/menu/pizza-margherita-480.jpg`

### 201 — evening-for-two

Master: `src/assets/menu/masters/evening-for-two.png`.

Built-in generated file: `exec-1c13670e-0886-4286-9499-9b7563ea04cf.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: EXACTLY two whole pizzas of equal 30cm size: one Margherita with tomato, mozzarella and basil; one pepperoni with mozzarella, red onion, oregano. EXACTLY one large 1 litre bottle dark craft cola. No side dishes, water or extra drinks. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/combo-480.jpg`

### 202 — movie-night

Master: `src/assets/menu/masters/movie-night.png`.

Built-in generated file: `exec-5a8a2e09-6794-4943-b22b-7dd7a9147aa4.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: EXACTLY one whole 30cm pepperoni pizza with mozzarella, red onion and oregano, ONE matte charcoal bowl rosemary potato wedges, ONE large 1 litre bottle dark cola. No additional pizzas or drinks. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/combo-480.jpg`

### 203 — family-oven

Master: `src/assets/menu/masters/family-oven.png`.

Built-in generated file: `exec-9b5def86-9fec-4bae-9a4e-2db201a4b2c3.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: EXACTLY THREE whole equal-size pizzas (Margherita, pepperoni, mushroom), EXACTLY TWO side bowls (rosemary potato wedges and mozzarella sticks), EXACTLY FOUR small 330ml glass cola bottles. Fit all items clearly into square composition, no extra drinks or dishes. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/combo-480.jpg`

### 204 — napoli-lunch

Master: `src/assets/menu/masters/napoli-lunch.png`.

Built-in generated file: `exec-186cfb4d-5431-4cf5-98f9-471c7ebc3e32.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: EXACTLY one small whole 25cm Margherita pizza (tomato, mozzarella, basil), ONE small matte charcoal bowl tomato salad, ONE clear 500ml bottle plain water. No other pizzas, cola, potatoes. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/combo-480.jpg`

### 301 — rosemary-potatoes

Master: `src/assets/menu/masters/rosemary-potatoes.png`.

Built-in generated file: `exec-beb0cf1b-b9c0-4d7d-b736-f30a1fea9b40.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE matte dark shallow bowl golden roasted potato wedges with garlic, sea salt and rosemary. Only potato side dish, no breaded sticks, no dip. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`

### 302 — mozzarella-sticks

Master: `src/assets/menu/masters/mozzarella-sticks.png`.

User-approved preview, copied without alteration.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog image for Палочки моцареллы. Input image is a style reference from the snacks category: match pale subtly mottled stone tabletop, matte charcoal ceramic bowls, blue linen at lower right, soft directional daylight, overhead food photography. Subject: a centered matte dark shallow bowl containing golden crispy breaded mozzarella STICKS, recognizably elongated sticks rather than nuggets. One stick split neatly in two to reveal white stretchy mozzarella with a short realistic cheese pull, resting on the bowl. Small matching ramekin of red tomato dip next to bowl. Exact dish: crispy breading, mozzarella, tomato dip. Remove the reference potatoes entirely; no other foods, no basil leaves, no herbs scattered on table, no cutlery or hands. Bowl and dip form a balanced tight catalog composition with comfortable margin, full bowl visible. Preserve reference photographic realism, color temperature and lighting. No text, logos or watermark. New preview, preserve original.

References: The corresponding category originals; see artifacts/image-preview-review/PREVIEW-PROMPTS.md.

### 303 — chicken-polpette

Master: `src/assets/menu/masters/chicken-polpette.png`.

Built-in generated file: `exec-d90c25a9-bea4-4289-9ae7-aef9f9de6c24.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE matte dark shallow bowl of round oven-baked chicken meatballs (polpette), lightly golden, grated parmesan, red arrabbiata sauce around them. Recognizably spherical meatballs, no sticks or potatoes. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`

### 304 — tomato-burrata-salad

Master: `src/assets/menu/masters/tomato-burrata-salad.png`.

Built-in generated file: `exec-b141d0ae-2082-439c-8efb-c8001be8be65.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE matte dark shallow bowl fresh red tomato wedges and cherry tomatoes with a white burrata ball, basil and olive oil. Clearly a salad, no pizza crust, bread, zucchini, peppers. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`

### 305 — focaccia-garlic

Master: `src/assets/menu/masters/focaccia-garlic.png`.

Built-in generated file: `exec-36e18492-bacd-49d0-a9a7-b13de3e3beef.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE matte dark plate with thick rectangular slices of airy golden focaccia, dimpled top, garlic oil, parmesan and parsley. Show airy bread cross-section. No pizza, tomato sauce, mozzarella, other dishes. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`

### 401 — basil-lemonade

Master: `src/assets/menu/masters/basil-lemonade.png`.

Built-in generated file: `exec-2f32d1f9-06d3-4cfc-ab70-a938a1047e59.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE clear 400ml tumbler pale yellow fizzy lemonade with lemon slices, fresh basil and ice, dark round coaster. No bottles, other drinks or scattered fruit. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/drinks-480.jpg`

### 402 — blood-orange-lemonade

Master: `src/assets/menu/masters/blood-orange-lemonade.png`.

Built-in generated file: `exec-e9b1b4b5-21c2-46af-a085-d69006836fad.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE clear 400ml tumbler reddish-orange citrus soda with blood orange and pink grapefruit slices and ice, dark round coaster. No basil, bottles or additional drinks. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/drinks-480.jpg`

### 403 — craft-cola

Master: `src/assets/menu/masters/craft-cola.png`.

Built-in generated file: `exec-094ffc31-4690-475b-b481-dd36523510c5.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE small 330ml clear glass bottle filled with dark brown craft cola with subtle condensation, simple cobalt cap. No lemon, herbs, ice inside bottle, other drinks. Bottle standing upright photographed at elevated angle, entire bottle visible. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/drinks-480.jpg`

### 404 — sparkling-water

Master: `src/assets/menu/masters/sparkling-water.png`.

Built-in generated file: `exec-839d230e-8739-44e0-8cf7-8a4f624715ae.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE clear 500ml bottle transparent mineral sparkling water with many fine visible carbonation bubbles, cobalt blue cap, minimal neat label with exact Russian text «С ГАЗОМ» and «0,5 л». Entire bottle visible, elevated camera. No lemon, herbs, other drinks. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/drinks-480.jpg`

### 405 — still-water

Master: `src/assets/menu/masters/still-water.png`.

Built-in generated file: `exec-04918e58-9dd6-4e31-b77c-2d5be9dbd02c.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE clear 500ml bottle transparent still mineral water, calm water without bubbles, white cap, minimal neat label with exact Russian text «БЕЗ ГАЗА» and «0,5 л». Entire bottle visible, elevated camera. No lemon, herbs or other drinks. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `public/menu/drinks-480.jpg`

### 501 — tiramisu

Master: `src/assets/menu/masters/tiramisu.png`.

Built-in generated file: `exec-89ce8f2d-1df6-4266-bfc6-6ca3a7a2e19b.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE square individual portion tiramisu on an ivory ceramic plate: distinct espresso-soaked savoiardi and mascarpone layers, cocoa top. No other desserts, chocolate chips, berries or mint. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mini-cannoli-preview-v1.png`

### 502 — mini-cannoli

Master: `src/assets/menu/masters/mini-cannoli.png`.

User-approved preview, copied without alteration.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli dessert catalog image for Мини-канноли. Input image is the existing DESSERT CATEGORY style reference. Match pale lightly veined stone tabletop, ivory ceramic round plate, blue linen to the left, soft directional daylight, slightly angled overhead food photography, realistic pastry textures. Subject must be EXACTLY TWO small crisp golden cannoli tubes filled with white ricotta cream and chopped green pistachios at BOTH ends. Place two cannoli naturally side by side near the center of the plate, each entire tube visible; a light powdered sugar dusting like reference. Food is prominent enough for a small product card. Exact menu description: two crispy tubes with ricotta and pistachio. No chocolate chips, chocolate, berries, mint, tiramisu, pudding, extra pastries, sauces, utensils or hands. Use smaller plate and tighter framing appropriate for one portion while keeping the reference lighting and restrained composition. No text, logos, watermark. New preview only; preserve original files.

References: The corresponding category originals; see artifacts/image-preview-review/PREVIEW-PROMPTS.md.

### 503 — chocolate-budino

Master: `src/assets/menu/masters/chocolate-budino.png`.

Built-in generated file: `exec-c3664b13-32fa-4ad1-a851-1a6061d985f1.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE small dark ceramic cup of glossy dark chocolate budino pudding made with cream, topped with a few flakes sea salt. Cup on small ivory plate. No nuts, berries, cannoli, tiramisu or mint. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mini-cannoli-preview-v1.png`

### 504 — lemon-panna-cotta

Master: `src/assets/menu/masters/lemon-panna-cotta.png`.

Built-in generated file: `exec-524ae79a-63b0-41f6-823b-3427a88bdaf7.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Balanced overhead or slightly elevated composition, full serving visible, tight product framing. Subject: ONE individual creamy white panna cotta on ivory plate, glossy yellow lemon curd on top and a few fresh red raspberries. No other desserts, mint, chocolate or nuts. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mini-cannoli-preview-v1.png`

### 601 — tomato-sauce

Master: `src/assets/menu/masters/tomato-sauce.png`.

Built-in generated file: `exec-5683c64f-b30b-45bf-bbf4-360e4f613d99.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down, small single ramekin centered, tighter framing so sauce is clearly visible with restrained margins. Subject: ONE small matte charcoal ceramic ramekin containing 50g red pelati tomato sauce, fine garlic, dried oregano and olive oil. Smooth rustic tomato texture. No side dishes, pizza, whole vegetables or garnish outside sauce. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`

### 602 — parmesan-sauce

Master: `src/assets/menu/masters/parmesan-sauce.png`.

Built-in generated file: `exec-4955c6bd-cb9e-470c-8da1-915e30204882.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down, small single ramekin centered, tighter framing so sauce is clearly visible with restrained margins. Subject: ONE small matte charcoal ceramic ramekin containing 50g ivory creamy parmesan sauce, subtle grated parmesan and black pepper flecks. No tomato, basil, side dishes, pizza, whole ingredients. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`

### 603 — pesto-sauce

Master: `src/assets/menu/masters/pesto-sauce.png`.

Built-in generated file: `exec-478ea672-6fe1-4510-935f-92428da051ab.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down, small single ramekin centered, tighter framing so sauce is clearly visible with restrained margins. Subject: ONE small matte charcoal ceramic ramekin containing 50g vivid natural green basil pesto, finely ground parmesan and pine nuts, olive oil sheen. Clearly green sauce, not salad. No pizza or side dishes. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`

### 604 — arrabbiata-sauce

Master: `src/assets/menu/masters/arrabbiata-sauce.png`.

Built-in generated file: `exec-5292a5de-b1b3-45a9-844d-73bbc6d92ffd.png`.

Prompt: Use case: product-mockup. Generate ONE square photorealistic Napoli food catalog photograph. Match the supplied category references exactly in visual style, pale stone tabletop, soft directional daylight, blue linen corner, natural realistic textures and appetizing restrained food photography. References are STYLE references only; replace their subject with the EXACT described product, excluding unrelated foods. Top-down, small single ramekin centered, tighter framing so sauce is clearly visible with restrained margins. Subject: ONE small matte charcoal ceramic ramekin containing 50g deep red rustic arrabbiata tomato sauce with visible small red chili pieces, garlic and finely chopped parsley. No side dishes, pizza, whole vegetables or garnish outside sauce. No text or logos unless explicitly required on water labels; no watermark. Preserve original files.

References: `artifacts/image-preview-review/mozzarella-sticks-preview-v1.png`


