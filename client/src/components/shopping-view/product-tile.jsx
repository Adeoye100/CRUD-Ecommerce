import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { brandOptionsMap, categoryOptionsMap } from "@/config";
import { Badge } from "../ui/badge";

function ShoppingProductTile({
  product,
  handleGetProductDetails,
  handleAddtoCart,
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImage, setCurrentImage] = useState(product?.image || "");

  // Handle image source changes
  useEffect(() => {
    if (product?.image) {
      setCurrentImage(product.image);
      setImageError(false);
      setImageLoading(true);
    }
  }, [product?.image]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const getStockBadge = () => {
    if (product?.totalStock === 0) {
      return (
        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
          Out Of Stock
        </Badge>
      );
    }
    if (product?.totalStock < 10) {
      return (
        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
          {`Only ${product?.totalStock} items left`}
        </Badge>
      );
    }
    if (product?.salePrice > 0) {
      return (
        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
          Sale
        </Badge>
      );
    }
    return null;
  };

  const renderImage = () => {
    // Show loading skeleton while image loads
    if (imageLoading) {
      return (
        <div className="w-full h-[300px] object-cover rounded-t-lg bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-gray-400">Loading...</span>
        </div>
      );
    }

    // Show error state if image failed to load
    if (imageError || !currentImage) {
      return (
        <div className="w-full h-[300px] object-cover rounded-t-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-2">Image unavailable</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setImageError(false);
                setImageLoading(true);
                // Retry loading the original image
                if (product?.image) {
                  setCurrentImage(product.image);
                }
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    // Normal image display
    return (
      <img
        src={currentImage}
        alt={product?.title || "Product"}
        className="w-full h-[300px] object-cover rounded-t-lg transition-opacity duration-300"
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    );
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <div onClick={() => handleGetProductDetails(product?._id || product?.id)}>
        <div className="relative">
          {renderImage()}
          {getStockBadge()}
        </div>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-2 truncate">
            {product?.title || "Unknown Product"}
          </h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[16px] text-muted-foreground">
              {categoryOptionsMap[product?.category] || product?.category || "Uncategorized"}
            </span>
            <span className="text-[16px] text-muted-foreground">
              {brandOptionsMap[product?.brand] || product?.brand || "Unknown Brand"}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span
              className={`${
                product?.salePrice > 0 ? "line-through" : ""
              } text-lg font-semibold text-primary`}
            >
              ${product?.price || 0}
            </span>
            {product?.salePrice > 0 ? (
              <span className="text-lg font-semibold text-primary">
                ${product?.salePrice}
              </span>
            ) : null}
          </div>
        </CardContent>
      </div>
      <CardFooter>
        {product?.totalStock === 0 ? (
          <Button className="w-full opacity-60 cursor-not-allowed">
            Out Of Stock
          </Button>
        ) : (
          <Button
            onClick={() => handleAddtoCart(product?._id || product?.id, product?.totalStock)}
            className="w-full"
          >
            Add to cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ShoppingProductTile;
