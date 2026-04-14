import { redirect } from "next/navigation";

/** Mantido para links antigos: a área do mercado passou a ser `/mercado`. */
export default function LojaPage() {
  redirect("/mercado");
}
