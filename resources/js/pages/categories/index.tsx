import { Head, router, useForm } from '@inertiajs/react';
import {
    Edit,
    FolderPlus,
    Landmark,
    Plus,
    Sparkles,
    Tag,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { GuestCategory } from '@/types';

type Props = {
    categories: (GuestCategory & { attendees_count?: number })[];
};

export default function CategoriesIndex({ categories }: Props) {
    const [editingCategory, setEditingCategory] =
        useState<GuestCategory | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const form = useForm({
        name: '',
        scope: 'general',
        description: '',
        order: 0,
        is_active: true,
    });

    const startCreate = () => {
        setEditingCategory(null);
        form.setData({
            name: '',
            scope: 'general',
            description: '',
            order: categories.length + 1,
            is_active: true,
        });
        setIsCreating(true);
    };

    const startEdit = (cat: GuestCategory) => {
        setIsCreating(false);
        setEditingCategory(cat);
        form.setData({
            name: cat.name,
            scope: cat.scope,
            description: cat.description || '',
            order: cat.order,
            is_active: cat.is_active,
        });
    };

    const cancelForm = () => {
        setIsCreating(false);
        setEditingCategory(null);
        form.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            form.put(`/categories/${editingCategory.id}`, {
                onSuccess: () => cancelForm(),
            });
        } else {
            form.post('/categories', {
                onSuccess: () => cancelForm(),
            });
        }
    };

    const handleDelete = (cat: GuestCategory) => {
        if (
            confirm(`Are you sure you want to delete category "${cat.name}"?`)
        ) {
            router.delete(`/categories/${cat.id}`);
        }
    };

    return (
        <>
            <Head title="Guest Categories (Dynamic Data)" />

            <div className="flex flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
                            <Tag className="size-4" />
                            <span>Dynamic Configuration</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Guest Categories Management
                        </h1>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Configure categories dynamically for governors,
                            mayors, pswdo, cswdo, and custom delegate types
                        </p>
                    </div>

                    {!isCreating && !editingCategory && (
                        <Button onClick={startCreate} className="gap-2">
                            <Plus className="size-4" />
                            <span>Add New Category</span>
                        </Button>
                    )}
                </div>

                {/* Create or Edit Form Modal / Card */}
                {(isCreating || editingCategory) && (
                    <Card className="border-primary/30 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {editingCategory
                                    ? `Edit Category: ${editingCategory.name}`
                                    : 'Create Dynamic Guest Category'}
                            </CardTitle>
                            <CardDescription>
                                Set the scope level to determine whether this
                                category maps to a Province or Municipality
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="cat_name">
                                            Category Name{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="cat_name"
                                            required
                                            value={form.data.name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. Governors, Mayors, PSWDO, CSWDO"
                                            className="mt-1.5"
                                        />
                                        <InputError
                                            message={form.errors.name}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="cat_scope">
                                            Jurisdiction Scope{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <select
                                            id="cat_scope"
                                            value={form.data.scope}
                                            onChange={(e) =>
                                                form.setData(
                                                    'scope',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-neutral-900"
                                        >
                                            <option value="province">
                                                Province Level (e.g. Governors,
                                                PSWDO)
                                            </option>
                                            <option value="municipality">
                                                Municipality / City Level (e.g.
                                                Mayors, CSWDO)
                                            </option>
                                            <option value="general">
                                                General / Regional / National
                                            </option>
                                        </select>
                                        <InputError
                                            message={form.errors.scope}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="cat_desc">
                                            Description
                                        </Label>
                                        <Input
                                            id="cat_desc"
                                            value={form.data.description}
                                            onChange={(e) =>
                                                form.setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Optional description of this category"
                                            className="mt-1.5"
                                        />
                                        <InputError
                                            message={form.errors.description}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="cat_order">
                                            Sort Order Priority
                                        </Label>
                                        <Input
                                            id="cat_order"
                                            type="number"
                                            min={0}
                                            value={form.data.order}
                                            onChange={(e) =>
                                                form.setData(
                                                    'order',
                                                    parseInt(e.target.value) ||
                                                        0,
                                                )
                                            }
                                            className="mt-1.5"
                                        />
                                        <InputError
                                            message={form.errors.order}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={form.data.is_active}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="size-4 rounded border-neutral-300 text-primary"
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="cursor-pointer"
                                    >
                                        Active and selectable in registration
                                    </Label>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={cancelForm}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                    >
                                        {form.processing && <Spinner />}
                                        {editingCategory
                                            ? 'Update Category'
                                            : 'Create Category'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Categories Table */}
                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Dynamic Categories ({categories.length})
                        </CardTitle>
                        <CardDescription>
                            All categories used by registration and host
                            announcement
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-y border-neutral-200 bg-neutral-50/70 text-xs text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-6 py-3">Order</th>
                                        <th className="px-6 py-3">
                                            Category Name
                                        </th>
                                        <th className="px-6 py-3">
                                            Scope Level
                                        </th>
                                        <th className="px-6 py-3">
                                            Description
                                        </th>
                                        <th className="px-6 py-3">
                                            Registered Guests
                                        </th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {categories.map((cat) => (
                                        <tr
                                            key={cat.id}
                                            className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                                                #{cat.order}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">
                                                {cat.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        cat.scope === 'province'
                                                            ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                                            : cat.scope ===
                                                                'municipality'
                                                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                              : 'border-neutral-500/30 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300'
                                                    }
                                                >
                                                    {cat.scope === 'province'
                                                        ? 'Province Scope'
                                                        : cat.scope ===
                                                            'municipality'
                                                          ? 'Municipality Scope'
                                                          : 'General'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-neutral-500">
                                                {cat.description || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                {cat.attendees_count ?? 0}{' '}
                                                attendees
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        cat.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {cat.is_active
                                                        ? 'Active'
                                                        : 'Disabled'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            startEdit(cat)
                                                        }
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                                                    >
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    {(cat.attendees_count ??
                                                        0) === 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    cat,
                                                                )
                                                            }
                                                            className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Dynamic Guest Categories', href: '/categories' },
    ],
};
