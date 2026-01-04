import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { UserWithAdmin } from "@/lib/types";

export default function UserAvatar({ user }: { user: UserWithAdmin }) {
  return (
    <Link href={`/user/${user.id}`}>
      <Avatar>
        <AvatarImage
          src={user.image || undefined}
          alt={user.name || `使用者 ${user.id}`}
          loading="lazy"
        />
        <AvatarFallback className="text-xs font-semibold bg-muted">
          {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
