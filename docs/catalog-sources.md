# Product clue sources

The Ingredient Clues in `frontend/src/data/products.ts` and `server/src/catalog/seed-snapshot.ts` use the Fragrantica entries below. The order is curated for the quiz: a recognizable note appears first, followed by supporting notes. It does not necessarily reproduce Fragrantica's note pyramid or vote order. Each Product carries at most four clues.

| Product | Fragrantica entry | Clues shown in order |
| --- | --- | --- |
| Confetti | [2019](https://www.fragrantica.com/perfume/Lush/Confetti-58191.html) | Rose, Sandalwood, Violet |
| Dear John | [2004](https://www.fragrantica.com/perfume/Lush/Dear-John-13727.html) | Cedar, Clove |
| Love | [2011](https://www.fragrantica.com/perfume/Lush/Love-13129.html) | Lemongrass, Red Apple, Rose, Cinnamon |
| Karma | [1995](https://www.fragrantica.com/perfume/Lush/Karma-4367.html) | Sweet Orange, Patchouli, Pine, Lemongrass |
| Rose Jam | [2019](https://www.fragrantica.com/perfume/Lush/Rose-Jam-2019-63243.html) | Rose, Lemon, Geranium |
| Twilight | [2010](https://www.fragrantica.com/perfume/Lush/Twilight-10800.html) | Lavender, Tonka Bean, Ylang Ylang, Benzoin |
| Dirty | [2011](https://www.fragrantica.com/perfume/Lush/Dirty-11734.html) | Mint, Tarragon, Thyme, Lavender |
| Lord of Misrule | [2014](https://www.fragrantica.com/perfume/Lush/Lord-of-Misrule-29173.html) | Black Pepper, Patchouli, Vanilla |
| The Comforter | [2012](https://www.fragrantica.com/perfume/Lush/The-Comforter-22219.html) | Blackcurrant, Bergamot, Cypress |
| Honey I Washed The Kids | [body spray](https://www.fragrantica.com/perfume/Lush/Honey-I-Washed-The-Kids-62550.html) | Toffee, Honey, Caramel, Bergamot |
| Avocado Co-Wash | [2016](https://www.fragrantica.com/perfume/Lush/Avocado-Co-Wash-59340.html) | Bergamot, Olibanum |
| Grass | [2018](https://www.fragrantica.com/perfume/Lush/Grass-56373.html) | Grass, Neroli, Bergamot, Sandalwood |
| Death and Decay | [2014](https://www.fragrantica.com/perfume/Lush/Death-and-Decay-26630.html) | Jasmine, Ylang Ylang, Rose, Tonka Bean |
| Sticky Dates | [2023](https://www.fragrantica.com/perfume/Lush/Sticky-Dates-88995.html) | Caramel, Benzoin, Sandalwood |
| Super Milk | [2023](https://www.fragrantica.com/perfume/Lush/Super-Milk-88991.html) | Litsea Cubeba, Vanilla, Tonka Bean |
| Let The Good Times Roll | [2019](https://www.fragrantica.com/p/60072) | Popcorn, Caramel, Butter, Cinnamon |
| Big | [2019 body spray](https://www.fragrantica.com/perfume/Lush/Big-62544.html) | Neroli, Orange Blossom, Vanilla |
| Sakura | [body spray](https://www.fragrantica.com/perfume/Lush/Sakura-62301.html) | Lemon, Mimosa, Jasmine |
| Sex Bomb | [2017](https://www.fragrantica.com/perfume/Lush/Sex-Bomb-60028.html) | Jasmine, Ylang Ylang, Clary Sage |
| Chelsea Morning | [2024](https://www.fragrantica.com/perfume/Lush/Chelsea-Morning-97106.html) | Toffee, Lemon, Vanilla, Tonka Bean |
| Vanillary | [2024](https://www.fragrantica.com/perfume/Lush/Vanillary-107548.html) | Vanilla, Jasmine, Tonka Bean |
| Junk | [2019](https://www.fragrantica.com/perfume/Lush/Junk-58783.html) | Blackcurrant, Rosemary, Lemon, Sage |
| 4:20 PM | [2021](https://www.fragrantica.com/perfume/Lush/4-20-PM-72228.html) | Cannabis, Patchouli, Oakmoss, Sandalwood |
| 29 High Street | [2013](https://www.fragrantica.com/perfume/Lush/29-High-Street-39761.html) | Honey, Green Notes, Caramel |

Fragrantica lists broad accords for 29 High Street, so its Green Notes clue is an accord rather than a named raw material. Its Super Milk 2023 entry differs from the later 2025 release; this catalog follows the 2023 entry. The Sticky Dates entry lists caramel, benzoin, and sandalwood rather than dates or coffee. Death and Decay lists tonka bean; lilac and lily were not added. Neroli and Orange Blossom share an orange-blossom illustration, and Sage and Clary Sage share a sage illustration.

The server snapshot is input to a one-time seed. Changing it does not overwrite an existing database catalog or admin edits; the current game frontend reads its bundled catalog.
