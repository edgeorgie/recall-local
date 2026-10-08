export interface SampleDoc {
  name: string;
  text: string;
}

export const SAMPLES: SampleDoc[] = [
  {
    name: "Recipes.md",
    text: `Weeknight tomato pasta: soften garlic in olive oil, add crushed tomatoes and a pinch of sugar, simmer twenty minutes, and finish with fresh basil and a splash of pasta water so the sauce clings.

Sourdough notes: keep the starter at room temperature and feed it twice a day. A hotter kitchen makes the dough rise faster, so shorten the bulk fermentation in summer.

Crispy roast potatoes: parboil in salted water, shake them in the pot to roughen the edges, then roast in very hot oil. Semolina on the surface makes them extra crunchy.

Quick lentil soup: cook red lentils with onion, carrot and cumin. Blend half for a creamy texture and finish with lemon juice and plenty of black pepper.`,
  },
  {
    name: "Lisbon trip.md",
    text: `Flights land at 9am, so we drop the bags at the hostel in Alfama and walk up to the castle before the crowds arrive. Buy the tram 28 ticket in advance because the queue at the stop is long.

Day two: take the train to Sintra early. Pena Palace first, then the quiet Quinta da Regaleira gardens. Pack a light rain jacket because the hills catch fog even in summer.

Food list: pastel de nata at the bakery in Belem, grilled sardines in Alfama, and bifana sandwiches at a small counter near Rossio. Reserve fado night at least a week ahead.

Budget: about eighty euros a day including the hostel, local transport and meals. Withdraw cash at ATMs, not exchange offices, for a better rate.`,
  },
  {
    name: "Work notes.md",
    text: `Quarterly planning: the main goal is cutting page load time under two seconds. Start by auditing the largest images and the third party scripts that block rendering.

Meeting with design on Thursday: agree on the new onboarding flow and decide which steps can be skipped. Bring the funnel numbers that show where people drop off.

Hiring plan: open one senior frontend role and one data analyst role. Write the job descriptions with concrete projects instead of long lists of tools.

Retro takeaways: deploys on Friday caused two incidents, so freeze releases after noon on Thursday. Add a short checklist to the pull request template and keep standups under fifteen minutes.`,
  },
];
