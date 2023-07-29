export const displayMap = (locations) => {
    mapboxgl.accessToken = "pk.eyJ1Ijoiemh0MjAwMzEwIiwiYSI6ImNsa2lrYmRzcTBqbHQzc210ZjlhMjB0cTEifQ.FMyyhG1NQRu4M7wEO7OTpQ";

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/zht200310/clkil44mo00p201qk8w2w7l9c',
        scrollZoom: false
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        //create marker
        const el = document.createElement('div');
        el.className = "marker";

        //add marker
        new mapboxgl.Marker({
            element: el,
            anchor: "bottom"
        }).setLngLat(loc.coordinates).addTo(map);

        //add pop ups
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);

        //extends map bound to include current locations
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}
