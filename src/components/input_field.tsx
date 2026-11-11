import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FieldError } from "@/components/field_error";
import { Input } from "@/components/ui/input";

type InputFieldProps = ComponentProps<typeof Input> & {
  invalid?: boolean;
  error?: ReactNode;
};

export function InputField({ invalid, error, ...props }: InputFieldProps) {
  const { t } = useTranslation();
  return (
    <>
      <Input aria-invalid={invalid} {...props} />
      <FieldError>{invalid && (error || t("common.errors.required"))}</FieldError>
    </>
  );
}
