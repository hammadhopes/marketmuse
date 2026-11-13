import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/shop.context.jsx";
import Title from "./Title.jsx";
import ProductItem from "./ProductItem.jsx";


function BestSeller() {
    const { products } = useContext(ShopContext);
    const [ bestSeller, setBestSeller ] = useState([]);

    useEffect(() => {
        setBestSeller(products.filter(item => item.bestseller).slice(0, 5));
    }, []);

    return (
        <div className="my-10">
            <div className="text-center text-3xl py-8">
                <Title text1={"BEST"} text2={"SELLERS"} />
                <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
                    Shop our best-selling favorites, loved by customers for their quality, style, and exceptional value.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                {
                    bestSeller.map(item => 
                        <ProductItem key={item._id} id={item._id} name={item.name} image={item.image} price={item.price} />
                    )
                }
            </div>
        </div>
    );
}

export default BestSeller;