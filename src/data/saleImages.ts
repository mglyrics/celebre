import meal1Img from "../assets/images/celebre_real_box_meal1_1790336339821.jpg";
import meal2Img from "../assets/images/celebre_real_box_meal2_1790336354493.jpg";
import meal3Img from "../assets/images/celebre_real_box_meal3_1790336370477.jpg";
import meal4Img from "../assets/images/celebre_real_box_meal4_1790336384159.jpg";
import meal5Img from "../assets/images/celebre_real_box_meal5_1790336396930.jpg";
import meal6Img from "../assets/images/celebre_real_box_meal6_1790336410383.jpg";
import meal7Img from "../assets/images/celebre_real_box_meal7_1790336423204.jpg";
import meal8Img from "../assets/images/celebre_real_box_meal8_1790336439618.jpg";
import meal9Img from "../assets/images/celebre_real_box_meal9_1790336451314.jpg";
import meal10Img from "../assets/images/celebre_real_box_meal10_1790336462682.jpg";
import meal11Img from "../assets/images/celebre_real_box_meal11_1790336476100.jpg";
import meal12Img from "../assets/images/celebre_real_box_meal12_1790336488857.jpg";
import meal13Img from "../assets/images/celebre_sale13_box_1790680562831.jpg";
import meal14Img from "../assets/images/celebre_sale14_box_1790680577480.jpg";
import meal15Img from "../assets/images/celebre_sale15_box_1790680591817.jpg";
import meal16Img from "../assets/images/celebre_sale16_box_1790680604019.jpg";
import meal17Img from "../assets/images/celebre_sale17_box_1790680621870.jpg";
import meal18Img from "../assets/images/celebre_sale18_box_1790680636886.jpg";
import defaultBoxImg from "../assets/images/celebre_branded_box_1788040428186.jpg";

export const SALE_IMAGES: Record<string, string> = {
  "Sale-01": meal1Img,
  "Sale-02": meal2Img,
  "Sale-03": meal3Img,
  "Sale-04": meal4Img,
  "Sale-05": meal5Img,
  "Sale-06": meal6Img,
  "Sale-07": meal7Img,
  "Sale-08": meal8Img,
  "Sale-09": meal9Img,
  "Sale-10": meal10Img,
  "Sale-11": meal11Img,
  "Sale-12": meal12Img,
  "Sale-13": meal13Img,
  "Sale-14": meal14Img,
  "Sale-15": meal15Img,
  "Sale-16": meal16Img,
  "Sale-17": meal17Img,
  "Sale-18": meal18Img,
};

export function getSaleImage(code: string): string {
  // Normalize code, e.g. "Sale-01" or "Sale - 01"
  const normalized = code.replace(/\s+/g, "");
  return SALE_IMAGES[normalized] || defaultBoxImg;
}
