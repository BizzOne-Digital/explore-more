import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User, GuardianStudentLink, StudentProfile, Order, Donation } from "@/models";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has critical data
    const [orderCount, donationCount] = await Promise.all([
      Order.countDocuments({ userId: id }),
      Donation.countDocuments({ userId: id }),
    ]);

    // Optional: Prevent deletion if user has orders/donations
    // Uncomment this block if you want to protect accounts with financial records
    /*
    if (orderCount > 0 || donationCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete user with ${orderCount} order(s) and ${donationCount} donation(s). Consider deactivating instead.`,
          suggestion: "Set isActive = false to deactivate"
        },
        { status: 400 }
      );
    }
    */

    // Delete related records (optional - you may want to keep for records)
    await Promise.all([
      // Remove guardian-student links
      GuardianStudentLink.deleteMany({
        $or: [{ guardianId: id }, { studentId: id }],
      }),
      // Remove student profile if exists
      StudentProfile.deleteOne({ userId: id }),
      // Note: Orders and Donations are kept for financial records
      // You can add more cleanup here based on your models
    ]);

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `User account deleted successfully`,
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}

// Alternative: Deactivate instead of delete (safer approach)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "deactivate") {
      user.isActive = false;
      await user.save();
      return NextResponse.json({
        success: true,
        message: `User account deactivated`,
      });
    } else if (action === "activate") {
      user.isActive = true;
      await user.save();
      return NextResponse.json({
        success: true,
        message: `User account activated`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update user" },
      { status: 500 }
    );
  }
}
