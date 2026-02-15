import { redirect } from "next/navigation";

export default async function PublicProfilePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    // Always redirect to the new user profile route
    redirect(`/user/${params.id}`);
}
