import { NextResponse } from "next/server";
import { getActivePricingCategories } from "@/app/actions/pricingCategory.actions";

export async function GET() {
  try {
    const data = await getActivePricingCategories();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
