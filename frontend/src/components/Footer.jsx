import { assets } from "../assets/assets.js";


function Footer() {
    return (
        <div>
            <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
                <div>
                    <img className="w-40" src={assets.logo} alt="" />
                    <p className="w-full md:w-2/3 text-gray-700">
                        Redefine your everyday style with thoughtfully curated fashion, quality essentials, and timeless pieces designed to make every moment feel special.
                    </p>
                </div>

                <div>
                    <p className="text-xl font-medium mb-5">COMPANY</p>
                    <ul className="flex flex-col gap-1 text-gray-700">
                        <li>Home</li>
                        <li>About us</li>
                        <li>Delivery</li>
                        <li>Privacy Policy</li>
                    </ul>
                </div>

                <div>
                    <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
                    <ul className="flex flex-col gap-1 text-gray-700">
                        <li>+1-212-456-7890</li>
                        <li>contact@marketmuse.com</li>
                    </ul>
                </div>
            </div>

            <div>
                <hr />
                <p className="py-5 text-sm text-center">© 2026 MarketMuse. All Rights Reserved.</p>
            </div>
        </div>
    );
}

export default Footer;