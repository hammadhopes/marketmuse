import BestSeller from "../components/BestSeller.jsx";
import Hero from "../components/Hero.jsx";
import LatestCollection from "../components/LatestCollection.jsx";


function Home() {
    return (
        <div>
            <Hero />
            <LatestCollection />
            <BestSeller />
        </div>
    );
}

export default Home;