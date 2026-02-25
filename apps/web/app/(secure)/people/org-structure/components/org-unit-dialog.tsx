import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { Separator } from "@/components/ui/separator"
import { OrgUnit } from "@hybrid-hris/db/types"
import { RequiredInput } from "@/components/ui/required-input"

export function OrgUnitDialog({
    parentId,
    open,
    onClose,
    initialData,
}: {
    parentId: string | null
    open: boolean
    onClose: () => void,
    initialData?: OrgUnit | null
}) {
    const [name, setName] = useState(initialData?.name ?? "")
    const [code, setCode] = useState(initialData?.code ?? "")
    const [touched, setTouched] = useState(false)

    const isEdit = !!initialData


    async function handleSubmit() {
        if (isEdit && initialData) {
            await apiFetch(`/org-units/${initialData.id}`, {
                method: "PATCH",
                body: JSON.stringify({ name, code }),
            })
        } else {
            await apiFetch("/org-units", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    code,
                    parentId,
                }),
            })
        }

        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent key={initialData?.id ?? "create"}>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Organization Unit" : "Create Organization Unit"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update organization unit details."
                            : parentId
                                ? "Create a new sub-organization under the selected unit."
                                : "Create a new top-level organization unit."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <RequiredInput
                        label="Name"
                        value={name}
                        onChangeAction={(value: string) => {
                            setName(value)
                        }}
                        placeholder="e.g. Human Resources"
                        required
                        touched={touched}
                        errorMessage="Name is required."
                    />

                    <RequiredInput
                        label="Code"
                        value={code}
                        onChangeAction={(value: string) => setCode(value)}
                        placeholder="e.g. HR"
                        required
                        touched={touched}
                        errorMessage="Code is required."
                        helperText="Short unique identifier used internally (e.g. HR for Human Resources)."
                    />
                    <Separator />
                    <DialogFooter className="w-full">
                        <div className="flex w-full items-center justify-between">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                onClick={() => {
                                    setTouched(true)
                                    if (!name.trim() || !code.trim()) return
                                    handleSubmit()
                                }}
                                disabled={!name.trim() || !code.trim()}
                            >
                                {isEdit ? "Save Changes" : "Create"}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}