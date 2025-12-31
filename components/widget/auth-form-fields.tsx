"use client";

// 認証フォームの共通フィールドコンポーネント
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AuthFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
}

// Email フィールドコンポーネント
export function EmailField<T extends FieldValues>({
  control,
}: AuthFormFieldsProps<T>) {
  return (
    <FormField
      control={control}
      name={"email" as FieldPath<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>電子郵件</FormLabel>
          <FormControl>
            <Input type="email" placeholder="example@email.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Password フィールドコンポーネント
export function PasswordField<T extends FieldValues>({
  control,
}: AuthFormFieldsProps<T>) {
  return (
    <FormField
      control={control}
      name={"password" as FieldPath<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>密碼</FormLabel>
          <FormControl>
            <Input type="password" placeholder="••••••••" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Confirm Password フィールドコンポーネント
export function ConfirmPasswordField<T extends FieldValues>({
  control,
}: AuthFormFieldsProps<T>) {
  return (
    <FormField
      control={control}
      name={"confirmPassword" as FieldPath<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>確認密碼</FormLabel>
          <FormControl>
            <Input type="password" placeholder="••••••••" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
